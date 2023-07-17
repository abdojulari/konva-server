// app.js
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./middlewares/sessionMiddleware');
const passportMiddleware = require('./middlewares/passportMiddleware');
const authenticationMiddleware = require('./middlewares/authenticationMiddleware');
const routes = require('./routes');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
origin: 'http://localhost:4200',
methods: ['GET', 'POST'],
}));
app.use(sessionMiddleware);
app.use(passportMiddleware.initialize());
app.use(passportMiddleware.session());
app.use(cookieParser());

app.use('/', routes);