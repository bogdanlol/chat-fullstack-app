import _ from 'lodash'
import {OrderedMap} from 'immutable'
import {websocketUrl} from './conn'

export default class Realtime {


    constructor(control) {

        this.control = control;
        this.ws = null;
        this.isConnected = false;

        this.connect();
        this.reconnect();
    }


    reconnect(){

        const control = this.control;

        window.setInterval(()=>{

            const user = control.UserCurent();
            if(user && !this.isConnected){

                console.log("try reconnecting...");

                this.connect();
            }

        }, 3000)
    }

    decodeMessage(msg) {

        let message = {};

        try {

            message = JSON.parse(msg);

        }
        catch (err) {

            console.log(err);
        }

        return message;
    }

    readMessage(msg) {

        const control = this.control;
        const currentUser = control.UserCurent();
        const currentUserId = _.toString(_.get(currentUser, '_id'));
        const message = this.decodeMessage(msg);

        const action = _.get(message, 'action', '');

        const payload = _.get(message, 'payload');

        switch (action) {

            // case 'user_offline':
            //
            //     this.onUpdateUserStatus(payload, false);
            //     break;
            // case 'user_online':
            //
            //         const isOnline = true;
            //         this.onUpdateUserStatus(payload, isOnline);
            //
            //     break;
            case 'mesaj_adaugat':

                    const activeChannel = control.CanalCurent();

                    let notify = _.get(activeChannel, '_id') !== _.get(payload, 'channelId') && currentUserId !== _.get(payload, 'userId');
                    this.onAddMessage(payload, notify);

                break;

            case 'adauga_canal':

                
                this.onAddChannel(payload);

                break;

            default:

                break;
        }


    }


    onAddMessage(payload, notify = false){

        const control = this.control;
        const currentUser = control.UserCurent();
        const currentUserId = _.toString(_.get(currentUser, '_id'));

        let user = _.get(payload, 'user');


        // adauga user in cache
        user = control.adaugaUserInCache(user);

        const messageObject = {
            _id: payload._id,
            body: _.get(payload, 'body', ''),
            userId: _.get(payload, 'userId'),
            channelId: _.get(payload, 'channelId'),
            created: _.get(payload, 'created', new Date()),
            me: currentUserId === _.toString(_.get(payload, 'userId')),
            user: user,

        };



        

        control.seteazaMesajPeCanal(messageObject, notify);

    }
   
    onAddChannel(payload) {

        const control = this.control;

        const channelId = _.toString(_.get(payload, '_id'));
        const userId = `${payload.userId}`;

        const users = _.get(payload, 'users', []);


        let channel = {
            _id: channelId,
            title: _.get(payload, 'title', ''),
            isNew: false,
            lastMessage: _.get(payload, 'lastMessage'),
            members: new OrderedMap(),
            messages: new OrderedMap(),
            userId: userId,
            created: new Date(),
            

        };

        _.each(users, (user) => {

            // adauga user 

            const memberId = `${user._id}`;

            this.control.adaugaUserInCache(user);

            channel.members = channel.members.set(memberId, true);


        });



        const channelMessages = control.messages.filter((m) => _.toString(m.channelId)=== channelId);

        channelMessages.forEach((msg) => {

            const msgId = _.toString(_.get(msg, '_id'));
            channel.messages = channel.messages.set(msgId, true);

        })


        control.adaugaCanal(channelId, channel);

    }

    send(msg = {}) {

        const isConnected = this.isConnected;

        if (this.ws && isConnected) {

            const msgString = JSON.stringify(msg);

            this.ws.send(msgString);
        }

    }

    authentication() {
        const control = this.control;

        const tokenId = control.getUserTokenId();

        if (tokenId) {

            const message = {
                action: 'auth',
                payload: `${tokenId}`
            }

            this.send(message);
        }

    }


    connect() {

    

        const ws = new WebSocket(websocketUrl);
        this.ws = ws;


        ws.onopen = () => {


         

            this.isConnected = true;

            this.authentication();


            ws.onmessage = (event) => {

                this.readMessage(_.get(event, 'data'));


                console.log("Mesage from the server: ", event.data);
            }


        }

        ws.onclose = () => {

           
            this.isConnected = false;
            

        }

        ws.onerror = () => {

            this.isConnected = false;
            this.control.update();
        }


    }
}