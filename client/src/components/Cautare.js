import React, {Component} from 'react'
import _ from 'lodash'

export default class Cautare extends Component{


	constructor(props){
		super(props);


		this.handleOnClick = this.handleOnClick.bind(this);


	}


	handleOnClick(user){


		if(this.props.onSelect){
			this.props.onSelect(user);
		}
	}
	render(){

		const {control} = this.props;

		
		const users = control.getCautare();




		return <div className="cautareutilizator">

			<div className="listauseri">

			{users.map((user, index) => {
				console.log(user);
				return (<div onClick={() => this.handleOnClick(user)} key={index} className="user">
					<img src={control.incarcaAvatar(user)} alt="..." />
					<h2>{_.get(user, 'name')}</h2>
				</div>)

			})}
				
				

			</div>
		</div>
	}
}