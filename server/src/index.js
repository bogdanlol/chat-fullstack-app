import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {version} from '../package.json'
import WebSocketServer, {Server} from 'uws';
import Router from './router'
import Model from './models'
import Database from './database'


const PORT = 3001;
const app = express();
app.server = http.createServer(app);



app.use(cors({
    exposedHeaders: "*"
}));

app.use(bodyParser.json({
    limit: '50mb'
}));



app.wss = new Server({
	server: app.server
});





new Database().connect().then((db) => {

	console.log("Successful connected to database.")

	app.db = db;
	
}).catch((err) => {


	throw(err);
});



app.models = new Model(app);
app.routers = new Router(app);





app.server.listen(process.env.PORT || PORT, () => {
        console.log(`Running on port  ${app.server.address().port}`);
});

export default app;