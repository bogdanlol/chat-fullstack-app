import React,{Component} from 'react'
import {Link} from 'react-router-dom'

export default class Meniu extends Component{

	constructor(props){
		super(props);



		this.onClickOutside = this.onClickOutside.bind(this);



	}


	onClickOutside(event){

		if(this.ref && !this.ref.contains(event.target)){

	
			if(this.props.onClose){
				this.props.onClose();
			}

		}
	}

	componentDidMount(){

		window.addEventListener('mousedown', this.onClickOutside);

	}
	componentWillUnmount(){

		window.removeEventListener('mousedown', this.onClickOutside);

	}



	render(){

		const {control} = this.props;

		const user = control.UserCurent();

		return <div className="meniu" ref={(ref) => this.ref = ref}>
			{user ? <div>

                <h2>Meniu</h2>
                <ul className="menu">
                		<Link to='/user'>
                	<li><button type="button">Profil</button></li>
                	</Link>
                    <li><button onClick={() => {
                        if(this.props.onClose){
                            this.props.onClose();
                        }

                        control.Exit();

                    }} type="button">Sign Out</button></li>

                </ul>

				</div> : null }

		</div>
	}
}