import {OrderedMap} from 'immutable'
import _ from 'lodash'
import Service from './service'
import Realtime from './realtime'

export default class Control {
    constructor(appComponent) {

        this.app = appComponent;
        this.service = new Service();
        this.messages = new OrderedMap();
        this.channels = new OrderedMap();
        this.activeChannelId = null;
        this.token = this.JtnDinCache();
        this.user = this.userDinCache();
        this.users = new OrderedMap();

        this.search = {
            users: new OrderedMap(),
        }


        this.realtime = new Realtime(this);

        this.returneazaCanale();
        this.AvatarNou()

    }
    update() {

        this.app.forceUpdate()
    }
    AvatarNou(userId, newAvatar){
        const message ={
            userId: userId,
            newAvatar: newAvatar
        };
        return new Promise((resolve, reject) => {

            this.service.post('api/changeAvatar', message).then((response) => {

                console.log("Avatar Updated", response.data);
                
                return resolve(response.data);

                    

            }).catch(err => {

                return reject(err);
            })


        });
    }
    leaveChannel(){


            const activeChannel = this.CanalCurent();
            const activeUser = this.UserCurent();
            const channelId = _.get(activeChannel,'_id');
            const userId =_.get(activeUser,'_id');

            const message= {
                userId: userId,
                channelId: channelId,

            };
            

       return new Promise((resolve, reject) => {

            this.service.post('api/leaveChannel', message).then((response) => {

                console.log("Channel Left", response.data);
                
                return resolve(response.data);

                    

            }).catch(err => {

                return reject(err);
            })


        });


     }
    isConnected(){

        return this.realtime.isConnected;
    }
    returneazaCanale(){

        const userToken = this.getUserTokenId();

        if(userToken){


            const options = {
                headers: {
                    authorization: userToken,
                }
            }

            this.service.get(`api/me/channels`, options).then((response) => {

                const channels = response.data;

                _.each(channels, (c) => {

                    this.realtime.onAddChannel(c);
                });


                const firstChannelId = _.get(channels, '[0]._id', null);

                this.returneazaMesaje(firstChannelId);


            }).catch((err) => {

                console.log("Error retrieving channnels", err);
            })
        }

    }

    adaugaUserInCache(user) {

        
        const id = _.toString(user._id);
        this.users = this.users.set(id, user);

        user.avatar = this.incarcaAvatar(user);
        return user;


    }

    getUserTokenId() {
        return _.get(this.token, '_id', null);
    }

    incarcaAvatar(user) {
       return _.get(user,"avatar");
      
    
        }

    
        


    CautaUtilizator(q = "") {

        
        const data = {search: q};

        this.search.users = this.search.users.clear();

        this.service.post('api/users/search', data).then((response) => {

            // lista userilor corespunzatori primiti din BD
            const users = _.get(response, 'data', []);

            _.each(users, (user) => {

              

                user.avatar = this.incarcaAvatar(user);
                
                const userId = `${user._id}`;

                this.users = this.users.set(userId, user);
                this.search.users = this.search.users.set(userId, user);


            });


    
            this.update();


        }).catch((err) => {


            console.log(err);
        })

    }

    seteazaJtn(accessToken) {

        if (!accessToken) {

            this.localStorage.removeItem('token');
            this.token = null;

            return;
        }

        this.token = accessToken;
        localStorage.setItem('token', JSON.stringify(accessToken));

    }

    JtnDinCache() {


        if (this.token) {
            return this.token;
        }

        let token = null;

        const data = localStorage.getItem('token');
        if (data) {

            try {

                token = JSON.parse(data);
            }
            catch (err) {

                console.log(err);
            }
        }

        return token;
    }

    userDinCache() {

        let user = null;
        const data = localStorage.getItem('me');
        try {

            user = JSON.parse(data);
        }
        catch (err) {

            console.log(err);
        }


        if (user) {

          
            const token = this.JtnDinCache();
            const tokenId = _.get(token, '_id');

            const options = {
                headers: {
                    authorization: tokenId,
                }
            }
            this.service.get('api/users/me', options).then((response) => {

                

                const accessToken = response.data;
                const user = _.get(accessToken, 'user');

                this.setUserCurent(user);
                this.seteazaJtn(accessToken);

            }).catch(err => {

                this.Exit();

            });

        }
        return user;
    }

    setUserCurent(user) {


  
        
        this.user = user;
        user.avatar = this.incarcaAvatar(user);

        if (user) {
            localStorage.setItem('me', JSON.stringify(user));

            
            const userId = `${user._id}`;
            this.users = this.users.set(userId, user);
        }

        this.update();

    }

    removeCookies(){

        this.channels = this.channels.clear();
        this.messages = this.messages.clear();
        this.users = this.users.clear();
    }
    Exit() {

        const userId = _.toString(_.get(this.user, '_id', null));
        const tokenId = _.get(this.token, '_id', null); 

        const options = {
            headers: {
                authorization: tokenId,
            }
        };

        this.service.get('api/me/logout', options);

        this.user = null;
        localStorage.removeItem('me');
        localStorage.removeItem('token');

        this.removeCookies();

        if (userId) {
            this.users = this.users.remove(userId);
        }

        this.update();
    }

    Inregistrare(user){

        return new Promise((resolve, reject) => {

            this.service.post('api/users', user).then((response) => {

                console.log("use created", response.data);

                return resolve(response.data);
            }).catch(err => {

                return reject("An error create your account");
            })


        });
    }
    login(email = null, password = null) {

        const userEmail = _.toLower(email);


        const user = {
            email: userEmail,
            password: password,
        }
       


        return new Promise((resolve, reject) => {


     

            this.service.post('api/users/login', user).then((response) => {

              

                const accessToken = _.get(response, 'data');
                const user = _.get(accessToken, 'user');

                this.setUserCurent(user);
                this.seteazaJtn(accessToken);

              

                this.realtime.connect();

               

                this.returneazaCanale();

      


            }).catch((err) => {

                console.log("Got an error login from server", err);
                
                const message = _.get(err, 'response.data.error.message', "Login Error!");

                return reject(message);
            })

        });


    }

    kickUser(channel = null, user = null) {

        if (!channel || !user) {
            return;
        }


        const userId = _.get(user, '_id');
        const channelId = _.get(channel, '_id');
        const userX = this.UserCurent();
        if(userId !== _.get(userX,'_id')){
        channel.members = channel.members.remove(userId);

        this.channels = this.channels.set(channelId, channel);

        this.update();}

    }

    InviteUserPeCanal(channelId, userId) {


        const channel = this.channels.get(channelId);

        if (channel) {

           
            channel.members = channel.members.set(userId, true);
            this.channels = this.channels.set(channelId, channel);
            this.update();
        }

    }

    getCautare() {

        return this.search.users.valueSeq();
    }

    CanalNou(channel = {}) {

        const channelId = _.get(channel, '_id');
        this.adaugaCanal(channelId, channel);
        this.seteazaCanalCurentDupaID(channelId);

      

    }

    UserCurent() {

        return this.user;
    }


    returneazaMesaje(channelId){


        let channel = this.channels.get(channelId);

        if (channel && !_.get(channel, 'isFetchedMessages')){

            const token = _.get(this.token, '_id');
            const options = {
                headers: {
                    authorization: token,
                }
            }

             this.service.get(`api/channels/${channelId}/messages`, options).then((response) => {



                    channel.isFetchedMessages = true;

                    const messages = response.data;

                    _.each(messages, (message) => {

                            this.realtime.onAddMessage(message);

                    });


                    this.channels = this.channels.set(channelId, channel);




            }).catch((err) => {

                console.log("An error fetching channel 's messages", err);
            })


        }

    }
    seteazaCanalCurentDupaID(id) {

        this.activeChannelId = id;

        this.returneazaMesaje(id);

        this.update();

    }


    CanalCurent() {

        const channel = this.activeChannelId ? this.channels.get(this.activeChannelId) : this.channels.first();
        return channel;

    }

    seteazaMesajPeCanal(message, notify = false) {

        const id = _.toString(_.get(message, '_id'));
        this.messages = this.messages.set(id, message);
        const channelId = _.toString(message.channelId);
        const channel = this.channels.get(channelId);

        if (channel) {
            channel.messages = channel.messages.set(id, true);
            channel.lastMessage = _.get(message, 'body', '');
            channel.notify = notify;

            this.channels = this.channels.set(channelId, channel);
        } else {

          
            this.service.get(`api/channels/${channelId}`).then((response) => {


                const channel = _.get(response, 'data');


                this.realtime.onAddChannel(channel);


            })
        }
        this.update();
    }

    adaugaMesaj(id, message = {}) {

       

        const user = this.UserCurent();
        message.user = user;

        this.messages = this.messages.set(id, message);


        const channelId = _.get(message, 'channelId');
        if (channelId) {

            let channel = this.channels.get(channelId);


            channel.lastMessage = _.get(message, 'body', '');

            
            const obj = {

                action: 'create_channel',
                payload: channel,
            };
            this.realtime.send(obj);



            this.realtime.send(
                {
                    action: 'create_message',
                    payload: message,
                }
            );

            channel.messages = channel.messages.set(id, true);


            channel.isNew = false;
            this.channels = this.channels.set(channelId, channel);


        }
        this.update();

       

    }

    retMesaje() {

        return this.messages.valueSeq();
    }

    retMesajeDePeCanal(channel) {

        let messages = new OrderedMap();


        if (channel) {


            channel.messages.forEach((value, key) => {


                const message = this.messages.get(key);

                messages = messages.set(key, message);

            });

        }

        return messages.valueSeq();
    }

    retMembriiDePeCanal(channel) {

        let members = new OrderedMap();

        if (channel) {


            channel.members.forEach((value, key) => {


                const userId = `${key}`;
                const user = this.users.get(userId);

                    members = members.set(key, user);
                    
                    

            });
        }

        return members.valueSeq();
        
    }

    adaugaCanal(index, channel = {}) {
        this.channels = this.channels.set(`${index}`, channel);

        this.update();
    }

    retCanale() {

        this.channels = this.channels.sort((a, b) => a.updated < b.updated);

        return this.channels.valueSeq();
    }

    
}