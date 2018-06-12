import moment from 'moment';
import _ from 'lodash'


export const START_TIME = new Date();

export default class Router {


    constructor(app) {

        this.app = app;


        this.setupRouter = this.setupRouter.bind(this);


        this.setupRouter();
    }

    setupRouter() {

        const app = this.app;




       
        app.post('/api/users', (req, res, next) => {

            const body = req.body;

            app.models.user.create(body).then((user) => {

                _.unset(user, 'password');

                return res.status(200).json(user);

            }).catch(err => {


                return res.status(503).json({error: err});
            })


        });


       

        app.get('/api/users/me', (req, res, next) => {

            let tokenId = req.get('authorization');

            if (!tokenId) {
        

                tokenId = _.get(req, 'query.auth');
            }


            app.models.token.loadJtnUser(tokenId).then((token) => {
                _.unset(token, 'user.password');

                return res.json(token);

            }).catch(err => {

                return res.status(401).json({
                    error: err
                })
            });


        });


        

        app.post('/api/users/search', (req, res, next) => {


            const keyword = _.get(req, 'body.search', '');

            app.models.user.search(keyword).then((results) => {


                return res.status(200).json(results);
            }).catch((err) => {

                return res.status(404).json({
                    error: 'Not found.'
                })
            })

        });


        

        app.get('/api/users/:id', (req, res, next) => {

            const userId = _.get(req, 'params.id');


            app.models.user.load(userId).then((user) => {

                _.unset(user, 'password');

                return res.status(200).json(user);
            }).catch(err => {

                return res.status(404).json({
                    error: err,
                })
            })


        });


        

        app.post('/api/users/login', (req, res, next) => {

            const body = _.get(req, 'body');


            app.models.user.login(body).then((token) => {


                _.unset(token, 'user.password');

                return res.status(200).json(token);


            }).catch(err => {

                return res.status(401).json({
                    error: err
                })
            })

        })


       


        app.get('/api/channels/:id', (req, res, next) => {

            const channelId = _.get(req, 'params.id');

            console.log(channelId);

            if (!channelId) {

                return res.status(404).json({error: {message: "Not found."}});
            }


            app.models.channel.load(channelId).then((channel) => {

                // fetch all uses belong to memberId

                const members = channel.members;
                const query = {
                    _id: {$in: members}
                };
                const options = {_id: 1, name: 1,avatar:1, created: 1};

                app.models.user.gaseste(query, options).then((users) => {
                    channel.users = users;

                    return res.status(200).json(channel);
                }).catch(err => {

                    return res.status(404).json({error: {message: "Not found."}});

                });


            }).catch((err) => {

                return res.status(404).json({error: {message: "Not found."}});
            })


        });


        
        app.get('/api/channels/:id/messages', (req, res, next) => {


            let tokenId = req.get('authorization');

            if (!tokenId) {
             

                tokenId = _.get(req, 'query.auth');
            }


            app.models.token.loadJtnUser(tokenId).then((token) => {


                const userId = token.userId;



                let filter = _.get(req, 'query.filter', null);
                if (filter) {

                    filter = JSON.parse(filter);
                    console.log(filter);
                }

                const channelId = _.toString(_.get(req, 'params.id'));
                const limit = _.get(filter, 'limit', 50);
                const offset = _.get(filter, 'offset', 0);


                

                this.app.models.channel.load(channelId).then((c) => {


                    const memberIds = _.get(c, 'members');

                    const members = [];

                    _.each(memberIds, (id) => {
                        members.push(_.toString(id));
                    })


                    if (!_.includes(members, _.toString(userId))) {

                        return res.status(401).json({error: {message: "Access denied"}});
                    }

                    this.app.models.message.rtnMessagesPeChannel(channelId, limit, offset).then((messages) => {


                        return res.status(200).json(messages);

                    }).catch((err) => {

                        return res.status(404).json({error: {message: "Not found."}});
                    })


                }).catch((err) => {

                    return res.status(404).json({error: {message: "Not found."}});

                })


            }).catch((err) => {


                return res.status(401).json({error: {message: "Access denied"}});


            });


        });


        

        app.get('/api/me/channels', (req, res, next) => {


            let tokenId = req.get('authorization');

            if (!tokenId) {
                // get token from query

                tokenId = _.get(req, 'query.auth');
            }


            app.models.token.loadJtnUser(tokenId).then((token) => {


                const userId = token.userId;


                const query = [

                    {
                        $lookup: {
                            from: 'users',
                            localField: 'members',
                            foreignField: '_id',
                            as: 'users',
                        }
                    },
                    {
                        $match: {
                            members: {$all: [userId]}
                        }
                    },
                    {
                        $project: {
                            _id: true,
                            title: true,
                            lastMessage: true,
                            created: true,
                            updated: true,
                            userId: true,
                            users: {
                                _id: true,
                                name: true,
                                created: true,
                                 avatar:true,
                                online: true
                               
                            },
                            members: true,
                        }
                    },
                    {
                        $sort: {updated: -1, created: -1}
                    },
                    {
                        $limit: 50,
                    }
                ];

                app.models.channel.agg(query).then((channels) => {


                    return res.status(200).json(channels);


                }).catch((err) => {

                    return res.status(404).json({error: {message: "Not found."}});
                })


            }).catch(err => {

                return res.status(401).json({
                    error: "Access denied."
                })
            });


        });




        
        app.get('/api/me/logout', (req, res, next) => {

            let tokenId = req.get('authorization');

            if (!tokenId) {
                

                tokenId = _.get(req, 'query.auth');
            }


            app.models.token.loadJtnUser(tokenId).then((token) => {


                app.models.token.logout(token);

                return res.status(200).json({
                    message: 'Successful.'
                });

            }).catch(err => {


                return res.status(401).json({error: {message: 'Access denied'}});
            })



        })

        app.post('/api/leaveChannel', (req,res,next)=>{

            const userId = _.get(req, 'body.userId', '');
            const channelId = _.get(req, 'body.channelId', '');
                    app.models.channel.removeOne(`${channelId}`,`${userId}`).then((channel)=>{
                         return res.status(200).json({
                    message: 'Successful.'
                });
                     }).catch(err=>{
                         return res.status(401).json({error: {err}});
                    })
             });

         app.post('/api/changeAvatar', (req,res,next)=>{

            const userId = _.get(req, 'body.userId', '');
            const newAvatar = _.get(req, 'body.newAvatar', '');
                    app.models.user.updateOne(`${userId}`,`${newAvatar}`).then((user)=>{
                         return res.status(200).json({
                    message: 'Successful.'
                });
                     }).catch(err=>{
                         return res.status(401).json({error: {err}});
                    })
             });
            
            

           
            
    }
}













