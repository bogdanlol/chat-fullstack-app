
import React, {Component} from 'react'
import _ from 'lodash'
import avatar from '../images/avatar.png'
import Formular from './Formular'
import Meniu from './Meniu'


export default class Bar extends Component {

    constructor(props) {
        super(props);

        this.state = {
            showUserForm: false,
            showUserMenu: false,
        }


    }

    render() {

        const {control} = this.props;

        const me = control.UserCurent();
        const profilePicture = control.incarcaAvatar(me);
        const isConnected = control.isConnected();

        return (
            <div className="user-bar">
                {me && !isConnected ? <div className="warn">Reconnecting... </div> : null}
                {!me ? <button onClick={() => {

                    this.setState({
                        showUserForm: true,
                    })

                }} type="button" className="login-btn">Sign In</button> : null}
                <div className="numeProfil">{_.get(me, 'name')}</div>
                <div className="imagProfil" onClick={() => {

                    this.setState({
                        showUserMenu: true,
                    })

                }}><img src={profilePicture ? profilePicture : avatar} alt=""/></div>

                {!me && this.state.showUserForm ? <Formular onClose={(msg) => {


                    this.setState({
                        showUserForm: false,
                    })

                }} control={control}/> : null}


                {this.state.showUserMenu ? <Meniu
                    control={control}
                    onClose={() => {

                        this.setState({
                            showUserMenu: false,
                        })
                    }}

                /> : null}

            </div>
        );
    }
}