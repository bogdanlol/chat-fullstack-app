import React, {Component} from 'react'
import classNames from 'classnames'
import {OrderedMap} from 'immutable'
import _ from 'lodash'
import {ObjectID} from '../objectid'
import CautareUtilizator from './Cautare'
import moment from 'moment'
import Bar from './Bar'



export default class DiscordClone extends Component {

    constructor(props) {

        super(props);

        this.state = {
            height: window.innerHeight,
            newMessage: '',
            searchUser: "",
            showSearchUser: false,
        }

        this.Resize = this.Resize.bind(this);
        this.Trimite = this.Trimite.bind(this)
        this.afisareMesaje = this.afisareMesaje.bind(this);
        this.scrollAutomat = this.scrollMessagesToBottom.bind(this)
        this.CreaareCanal = this.CreaareCanal.bind(this);
        this.afisareTitluCanal = this.afisareTitluCanal.bind(this)
        this.CanaleAvatar = this.CanaleAvatar.bind(this);

    }

    CanaleAvatar(canal){
        const {control} = this.props;
        const membrii = control.retMembriiDePeCanal(canal);
        const maxDisplay = 4;
        const total = membrii.size > maxDisplay ? maxDisplay : membrii.size;
        const avatars = membrii.map((user, index) => { return index < maxDisplay ?  <img key={index} src={_.get(user, 'avatar')} alt={_.get(user, 'name')} /> : null});
        return <div className={classNames('channel-avatars', `channel-avatars-${total}`)}>{avatars}</div>
    }
    afisareTitluCanal(canal = null) {

        if (!canal) {
            return null;
        }
        const {control} = this.props;
        const membrii = control.retMembriiDePeCanal(canal);
        const names = [];
        membrii.forEach((user) => {const name = _.get(user, 'name');
            names.push(name);
        })
        let title = _.join(names, ',');
        if (!title && _.get(canal, 'isNew')) {
            title = 'New message';
        }
        return <h2>{title}</h2>
    }

    ParasesteCanal(canal){
        const {control} =this.props;
        control.leaveChannel();
        control.returneazaCanale();
    }
    CreaareCanal() {

        const {control} = this.props;

        const currentUser = control.UserCurent();
        const currentUserId = _.get(currentUser, '_id');

        const canalId = new ObjectID().toString();
        const canal = {
            _id: canalId,
            title: '',
            lastMessage: "",
            members: new OrderedMap(),
            messages: new OrderedMap(),
            isNew: true,
            userId: currentUserId,
            created: new Date(),
        };

        canal.members = canal.members.set(currentUserId, true);


        control.CanalNou(canal);


    }

    scrollMessagesToBottom() {

        if (this.messagesRef) {

            this.messagesRef.scrollTop = this.messagesRef.scrollHeight;
        }
    }

    afisareMesaje(message) {

        const text = _.get(message, 'body', '');

        const html = _.split(text, '\n').map((m, key) => {

            return <p key={key} dangerouslySetInnerHTML={{__html: m}}/>
        })


        return html;
    }

    Trimite() {

        const {newMessage} = this.state;
        const {control} = this.props;



        if (_.trim(newMessage).length) {
            // Creerea mesajului prin id-ul userului curent,channelId

            const messageId = new ObjectID().toString();
            const channel = control.CanalCurent();
            const channelId = _.get(channel, '_id', null);
            const currentUser = control.UserCurent();

            const message = {
                _id: messageId,
                channelId: channelId,
                body: newMessage,
                userId: _.get(currentUser, '_id'),
                me: true,

            };


            control.adaugaMesaj(messageId, message);

            this.setState({
                newMessage: '',
            })
        }


    }

    Resize() {

        this.setState({
            height: window.innerHeight
        });
    }

    componentDidUpdate() {


        this.scrollMessagesToBottom();
    }

    componentDidMount() {


        window.addEventListener('resize', this.Resize);


    }


    componentWillUnmount() {

        window.removeEventListener('resize', this.Resize)

    }

    render() {

        const {control: Utiliz} = this.props;

        const {height} = this.state;

        const style = {
            height: height,
        };


        const CanalCurent = Utiliz.CanalCurent();
        const mesaje = Utiliz.retMesajeDePeCanal(CanalCurent);
        const Canale = Utiliz.retCanale();
        const membrii = Utiliz.retMembriiDePeCanal(CanalCurent);


        return (
            <div style={style} className="app-messenger">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>
                <div className="header">
                    <div className="stanga">
                        <button onClick ={()=>{
                            this.ParasesteCanal();
                            window.location.reload();
                        }}className="stanga-a"><i class="fa fa-times"></i></button>
                        <button onClick={this.CreaareCanal} className="dreapta-a"><i className="icon-edit-modify-streamline"/></button>
                        <h2>Conversations</h2>
                    </div>
                    <div className="continut">

                        {_.get(CanalCurent, 'isNew') ? <div className="toolbar">
                            <label>To:</label>
                            {
                                membrii.map((user, key) => {

                                    return <span onClick={() => {

                                        Utiliz.kickUser(CanalCurent, user);

                                    }} key={key}>{_.get(user, 'name')}</span>
                                })
                            }
                            <input placeholder="Persoana..." onChange={(event) => {

                                const searchUserText = _.get(event, 'target.value');



                                this.setState({
                                    searchUser: searchUserText,
                                    showSearchUser: true,
                                }, () => {


                                    Utiliz.CautaUtilizator(searchUserText);
                                });


                            }} type="text" value={this.state.searchUser}/>

                            {this.state.showSearchUser ? <CautareUtilizator
                                onSelect={(user) => {

                                    this.setState({
                                        showSearchUser: false,
                                        searchUser: '',
                                    }, () => {
                                        const userId = _.get(user, '_id');
                                        const channelId = _.get(CanalCurent, '_id');
                                        Utiliz.InviteUserPeCanal(channelId, userId);

                                    });
                                }}
                                control={Utiliz}/> : null}
                        </div> : <div className="EditTitle">{this.afisareTitluCanal(CanalCurent)}</div>}
                    </div>

                </div>
                <div className="princ">
                    <div className="clasare-stanga">

                        <div className="canale">
                            {Canale.map((channel, key) => {return ( <div onClick={(key) => {

                                    Utiliz.seteazaCanalCurentDupaID(channel._id);}} key={channel._id} className={classNames('chanel', {'notify': _.get(channel, 'notify') === true},{'active': _.get(CanalCurent, '_id') === _.get(channel, '_id', null)})}>
                                    <div className="imagine-utilizator">
                                        {this.CanaleAvatar(channel)}
                                    </div>
                                    <div className="chanel-info">
                                        {this.afisareTitluCanal(channel)}
                                        <p> {channel.lastMessage}</p>
                                    </div>

                                </div>
                            )

                            })}


                        </div>

                    </div>
                    <Bar control={Utiliz}/>
                    <div className="continut">
                        <div ref={(ref) => this.messagesRef = ref} className="mesaje">
                            {mesaje.map((mesaj, index) => {

                                const user = _.get(mesaj, 'user');
                                return (
                                    <div key={index} className={classNames('message', {'me': mesaj.me})}>
                                        <div className="imagineausermesaj">
                                            <img src={Utiliz.incarcaAvatar(user)} alt=""/>
                                        </div>
                                        <div className="mesaj-text">
                                            <div
                                                className="mesaj-autor">{mesaj.me ? _.get(mesaj, 'user.name')+" - "+moment(_.get(mesaj,'created')).fromNow() : _.get(mesaj, 'user.name')+" - "+moment(_.get(mesaj,'created')).fromNow()}
                                            </div>
                                            <div className="mesaj-text">
                                                {this.afisareMesaje(mesaj)}
                                            </div>
                                        </div>
                                    </div>
                                )


                            })}


                        </div>

                        {CanalCurent && membrii.size > 0 ? <div className="messenger-util">

                            <div className="text-util">
                                        <textarea onKeyUp={(event) => {


                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                this.Trimite();
                                            }


                                        }} onChange={(event) => {


                                            this.setState({newMessage: _.get(event, 'target.value')});

                                        }} value={this.state.newMessage} placeholder="Scrie un mesaj..."/>
                            </div>
                            <div className="actiuni">
                                <button onClick={this.Trimite} className="send"><i class="fa fa-send"></i></button>
                            </div>
                        </div> : null}
                    </div>
                    <div className="clasare-dreapta">
                        {membrii.size > 0? <div><h2 className="titlu">Participants</h2>
                            <div className="membrii">
                                {membrii.map((membru, key) => {
                                    return (
                                        <div key={key} className="membru">
                                            <div className="imagine-utilizator">
                                                <img src={Utiliz.incarcaAvatar(membru)} alt=""/>

                                            </div>
                                            <div className="informatie-membru">
                                                <h2>{membru.name} </h2>
                                                <p>Joined: {moment(membru.created).fromNow()}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div> : null}

                    </div>
                </div>
            </div>
        )
    }
}