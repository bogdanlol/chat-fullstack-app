import _ from 'lodash'
import {isEmail} from '../help'
import bcrypt from 'bcrypt'
import {ObjectID} from 'mongodb'
import {OrderedMap} from 'immutable'

const SR = 10;

export default class User {

    constructor(app) {

        this.app = app;

        this.users = new OrderedMap();

    }

    gaseste(query = {}, options = {}) {

        return new Promise((resolve, reject) => {
            this.app.db.collection('users').find(query, options).toArray((err, users) => {
                return err ? reject(err) : resolve(users);
            })
        });
    }

    search(q = "") {
        return new Promise((resolve, reject) => {
            const regex = new RegExp(q, 'i');
            const query = {
                $or: [
                    {name: {$regex: regex}},
                    {email: {$regex: regex}},
                ],
            };
            this.app.db.collection('users').find(query, {
                _id: true,
                name: true,
                avatar: true,
                created: true
            }).toArray((err, results) => {
                if (err || !results || !results.length) {
                    return reject({message: "Eroare login."})
                }
                return resolve(results);
            });

        });
    }

    login(user) {
        const email = _.get(user, 'email', '');
        const password = _.get(user, 'password', '');

        return new Promise((resolve, reject) => {

            if (!password || !email || !isEmail(email)) {
                return reject({message: "Eroare login."})
            }

            this.findUserByEmail(email, (err, result) => {

                if (err) {
                    return reject({message: "Eroare login."});
                }

                const hashPassword = _.get(result, 'password');
                const isMatch = bcrypt.compareSync(password, hashPassword);
                if (!isMatch) {
                    return reject({message: "Eroare login."});
                }

                const userId = result._id;
                this.app.models.token.create(userId).then((token) => {
                    token.user = result;
                    return resolve(token);
                }).catch(err => {
                    return reject({message: "Eroare login"});
                })
            });
        })
    }
    findUserByEmail(email, callback = () => {
    }) {
        this.app.db.collection('users').findOne({email: email}, (err, result) => {
            if (err || !result) {
                return callback({message: "User nu exista."})
            }
            return callback(null, result);
        });

    }
    load(id) {
        id = `${id}`;
        return new Promise((resolve, reject) => {
            const userInCache = this.users.get(id);
            if (userInCache) {
                return resolve(userInCache);
            }
            this.byUserId(id, (err, user) => {
                if (!err && user) {

                    this.users = this.users.set(id, user);
                }
                return err ? reject(err) : resolve(user);

            })
        })
    }
    byUserId(id, callback = () => {
    }) {

        if (!id) {
            return callback({message: "User nu exista"}, null);
        }

        const userId = new ObjectID(id);

        this.app.db.collection('users').findOne({_id: userId}, (err, result) => {


            if (err || !result) {

                return callback({message: "Userul nu exista"});
            }
            return callback(null, result);

        });
    }
    defaultAvatar(){
        return 'https://www.timeshighereducation.com/sites/default/files/byline_photos/default-avatar.png';
    }
    Format(user, callback = () => {
    }) {


        let errors = [];
        const fields = ['name', 'email', 'password'];
        const validations = {
            name: {
                errorMesage: 'Nume necesar',
                do: () => {

                    const name = _.get(user, 'name', '');

                    return name.length;
                }
            },
            email: {
                errorMesage: 'Email incorect',
                do: () => {

                    const email = _.get(user, 'email', '');

                    if (!email.length || !isEmail(email)) {
                        return false;
                    }


                    return true;
                }
            },
            password: {
                errorMesage: 'Mai mult de 3 caractere pentru parola!',
                do: () => {
                    const password = _.get(user, 'password', '');
                    if (!password.length || password.length < 3) {
                        return false;
                    }
                    return true;
                }
            }
        }
        fields.forEach((field) => {
            const fieldValidation = _.get(validations, field);
            if (fieldValidation) {

                const isValid = fieldValidation.do();
                const msg = fieldValidation.errorMesage;
                if (!isValid) {
                    errors.push(msg);
                }
            }
        });
        if (errors.length) {
            const err = _.join(errors, ',');
            return callback(err, null);
        }

        const email = _.toLower(_.trim(_.get(user, 'email', '')));
        this.app.db.collection('users').findOne({email: email}, (err,result) => {

            if (err || result) {
                return callback({message: "Email deja existent"}, null);
            }

            const password = _.get(user, 'password');
            const hashPassword = bcrypt.hashSync(password, SR);
            const avatar = this.defaultAvatar();
            const userFormatted = {
                name: `${_.trim(_.get(user, 'name'))}`,
                email: email,
                password: hashPassword,
                created: new Date(),
                avatar:avatar,
            };

            return callback(null, userFormatted);

        });
    }

    create(user) {
        const db = this.app.db;
        return new Promise((resolve, reject) => {

            this.Format(user, (err, user) => {


                if (err) {
                    return reject(err);
                }

                db.collection('users').insertOne(user, (err, info) => {
                    if (err) {
                        return reject({message: "Nu se poate salva utilizatorul."});
                    }
                    const userId = _.get(user, '_id').toString(); 
                    this.users = this.users.set(userId, user);
                    return resolve(user);

                });
            });

        });
    }
    updateOne(userId,newAvatar){
        return new Promise((resolve,reject)=>{
                const myquery ={_id:new ObjectID(userId)};
                const newValues ={$set:{avatar:newAvatar}};
                
                this.app.db.collection('users').update(myquery,newValues,function(err,res){
                    console.log(myquery,newValues);
                if(err) {
                    return reject(err);
                }
                return resolve(res);
            });
            });
            
            
}

}