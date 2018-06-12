import {OrderedMap} from 'immutable'
import {ObjectID} from 'mongodb'
import _ from 'lodash'

export default class Connection {

    constructor(app) {

        this.app = app;

        this.connections = OrderedMap();

        this.LoadScs();
    }


    rlMessage(msg) {

        let messageObject = null;
        try {
            messageObject = JSON.parse(msg);
        }
        catch (err) {
            console.log("An error decode the socket mesage", msg);
        }
        return messageObject;
    }
    sndTM(userId, obj) {

        const query = [
            {
                $match: {
                    members: {$all: [new ObjectID(userId)]}
                }
            },
            {

                $lookup: {

                    from: 'users',
                    localField: 'members',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $unwind: {

                    path: '$users'
                }
            },
            {
                $match: {'users.online': {$eq: true}}
            },
            {
                $group: {

                    _id: "$users._id"
                }
            }

        ];
        const users = [];

        this.app.db.collection('channels').aggregate(query, (err, results) => {

            if (err === null && results) {
                _.each(results, (result) => {

                    const uid = _.toString(_.get(result, '_id'));
                    if (uid) {
                        users.push(uid);
                    }
                });

                const memberConnections = this.connections.filter((con) => _.includes(users, _.toString(_.get(con, 'userId'))));
                if (memberConnections.size) {
                    memberConnections.forEach((connection, key) => {
                        const ws = connection.ws;
                        this.send(ws, obj);
                    });
                }
            }
        })
    }
    sendAll(obj) {

        this.connections.forEach((con, key) => {
            const ws = con.ws;

            this.send(ws, obj);
        });
    }
    send(ws, obj) {
        const message = JSON.stringify(obj);
        ws.send(message);
    }
    Execute(socketId, msg) {

        const action = _.get(msg, 'action');
        const payload = _.get(msg, 'payload');
        const userConnection = this.connections.get(socketId);
        switch (action) {

            case 'create_message':
                if (userConnection.isAuthenticated) {
                    let messageObject = payload;
                    messageObject.userId = _.get(userConnection, 'userId');
                    this.app.models.message.create(messageObject).then((message) => {
                        const channelId = _.toString(_.get(message, 'channelId'));
                        this.app.models.channel.load(channelId).then((channel) => {
                            const memberIds = _.get(channel, 'members', []);
                            _.each(memberIds, (memberId) => {
                                memberId = _.toString(memberId);
                                const memberConnections = this.connections.filter((c) => _.toString(c.userId) === memberId);
                                memberConnections.forEach((connection) => {
                                    const ws = connection.ws;
                                    this.send(ws, {
                                        action: 'mesaj_adaugat',
                                        payload: message,
                                    })
                                })
                            });
                        })

                    }).catch(err => {
                        const ws = userConnection.ws;
                        this.send(ws, {
                            action: 'create_message_error',
                            payload: payload,
                        })
                    })
                }
                break;
            case 'create_channel':
                let channel = payload;
                const userId = userConnection.userId;
                channel.userId = userId;
                this.app.models.channel.create(channel).then((chanelObject) => {
                    let memberConnections = [];
                    const memberIds = _.get(chanelObject, 'members', []);
                    const query = {
                        _id: {$in: memberIds}
                    };
                    const queryOptions = {
                        _id: 1,
                        name: 1,
                        avatar:1,
                        created: 1,
                    }
                    this.app.models.user.gaseste(query, queryOptions).then((users) => {
                        chanelObject.users = users;

                        _.each(memberIds, (id) => {
                            const userId = id.toString();
                            const memberConnection = this.connections.filter((con) => `${con.userId}` === userId);
                            if (memberConnection.size) {
                                memberConnection.forEach((con) => {
                                    const ws = con.ws;
                                    const obj = {
                                        action: 'adauga_canal',
                                        payload: chanelObject,
                                    }

                                    this.send(ws, obj);
                                })
                            }

                        });
                    });


                });

                break;
            case 'auth':
                const userTokenId = payload;
                let connection = this.connections.get(socketId);
                if (connection) {

                    this.app.models.token.loadJtnUser(userTokenId).then((token) => {
                        const userId = token.userId;
                        connection.isAuthenticated = true;
                        connection.userId = `${userId}`;
                        this.connections = this.connections.set(socketId, connection);
                        const obj = {
                            action: 'auth_success',
                            payload: 'Succes',
                        }
                        this.send(connection.ws, obj);
                       
                        const userIdString = _.toString(userId);
                        this.sndTM(userIdString, {
                            action: 'user_online',
                            payload: userIdString,
                        });

                    }).catch((err) => {

                        const obj = {
                            action: 'auth_error',
                            payload: "Eroare Autenticare: " + userTokenId
                        };
                        this.send(connection.ws, obj);
                    })

                }

                break;

            default:

                break;
        }
    }

    LoadScs() {

        this.app.wss.on('connection', (ws) => {

            const socketId = new ObjectID().toString();

            const clientConnection = {
                _id: `${socketId}`,
                ws: ws,
                userId: null,
                isAuthenticated: false,
            }
           
            this.connections = this.connections.set(socketId, clientConnection);

            ws.on('message', (msg) => {

                const message = this.rlMessage(msg);
                this.Execute(socketId, message);

            });

            ws.on('close', () => {

                const closeConnection = this.connections.get(socketId);
                const userId = _.toString(_.get(closeConnection, 'userId', null));
                this.connections = this.connections.remove(socketId);
                if (userId) {
                    const userConnections = this.connections.filter((con) => _.toString(_.get(con, 'userId')) === userId);
                    if (userConnections.size === 0) {

                        this.sndTM(userId, {
                            action: 'user_offline',
                            payload: userId
                        });

                    }
                }


            });
        });
    }
}