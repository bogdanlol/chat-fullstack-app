import React, {Component} from 'react'
import Control from '../control'
import DiscordClone from './discordClone'

export default class App extends Component{

	constructor(props){
		super(props);

		this.state = {

			control : new Control(this),
		}
	}

	render(){

		const {control} = this.state;
		return <div className="app-wrapper">
				<DiscordClone control={control} />
			</div>
	}
}