import React, {Component} from 'react'
import _ from 'lodash'
import Control from '../control'
import '../css/app.css'
import {Link} from 'react-router-dom'
export default class Profil extends Component {

    constructor(props) {
        super(props);
        this.state = {
          avatarValue:'',
			control: new Control(this),
		}
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(event){
      this.setState({
        avatarValue:event.target.value,
      })
    }
     handleSubmit (event) {

     const {control} = this.state;
      event.preventDefault();

      const user=control.UserCurent();
      const userId=_.get(user,'_id');
      const avatar = this.state.avatarValue;
      control.removeCookies();
      control.AvatarNou(userId,avatar);
      window.location.reload();
      control.update();
  }

    render() {

    	const {control} = this.state;
    	const user =control.UserCurent();
    	
    	return <div className="ProfilUtiliz">
    	<p className="name">Name : {_.get(user,'name')}</p>
  		<p className="email">Email : {_.get(user,'email')}</p>
  		<p className="created">Created : {_.get(user,'created')}</p>
  		<p className="avatar">Avatar :<img src={control.incarcaAvatar(user)} alt="..."/></p>
      <label>Enter Url for new Avatar</label>
      <form onSubmit={this.handleSubmit}>
      <div className="inputS">
     <input type="text" name="avatar" value={this.state.avatarValue} onChange={this.handleChange}></input>
      </div>
      
        <input type="submit" value="Submit"/>
      </form>
      <Link to='/'>
      <div className ="Button2"><button ClassName="Button2"type="button">Back</button></div>
      </Link>
  			</div>
    }
}