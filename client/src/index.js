import React from 'react';
import ReactDOM from 'react-dom';
import './css/app.css'
import App from './components/app';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Profil from './components/Profil'
ReactDOM.render(
  <Router>
      <div>
        <Route exact path="/" component={App} />
  		<Route path ="/user" component={Profil} />
      </div>
  </Router>,
  document.getElementById('root')
)
registerServiceWorker();