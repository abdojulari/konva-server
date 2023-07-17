// server.js
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const cors = require('cors');
const User = require('./models/User');
const sessionMiddleware = require('./middlewares/sessionMiddleware');
const socketAuthenticationMiddleware = require('./utils/socketAuthenticationMiddleware');
const routes = require('./routes');
const pool = require('./db');
const io = require('socket.io')(httpServer, {
cors: {
origin: 'http://localhost:4200',
methods: ['GET', 'POST'],
},
});
const { instrument } = require('@socket.io/admin-ui');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const port = 3000;
const shapes = {}; // Store shapes on the server
let users = {}; // Store users on the server

// const sessionMiddleware = session({
// store: new pgSession({
// pool: pool,
// tableName: 'user_session',
// sidName: 'sid',
// }),
// secret: process.env.SECRET,
// resave: false,
// saveUninitialized: false,
// cookie: {
// maxAge: 24 * 60 * 60 * 1000,
// httpOnly: true,
// expires: 24 * 60 * 60 * 1000,
// },
// });

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
origin: 'http://localhost:4200',
methods: ['GET', 'POST'],
}));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

// Routes
const routes = require('./routes');
app.use('/', routes);

// Socket.IO authentication middleware
const socketAuthenticationMiddleware = require('./utils/socketAuthenticationMiddleware');
io.use(socketAuthenticationMiddleware);

// Socket.IO event handlers
io.on('connection', (socket) => {
console.log('ABDUL', socket.request);
const currentUser = users;
const shapeTypes = ['Circle', 'Rect', 'Line', 'Arrow', 'Text'];

shapeTypes.forEach((shapeType) => {
socket.on(`create${shapeType}`, (shapeData) => {
shapes[shapeData.id] = shapeData;
io.emit(`create${shapeType}`, shapeData);
});


socket.on(`update${shapeType}`, (shapeData) => {
  shapes[shapeData.id] = shapeData;
  io.emit(`update${shapeType}`, shapeData);
});
});

// Handle the 'bringToFront' event
socket.on('bringToFront', (data) => {
// Broadcast the action to all connected clients
io.emit('bringToFront', data);
});

// Handle the 'sendToBack' event
socket.on('sendToBack', (data) => {
// Broadcast the action to all connected clients
io.emit('sendToBack', data);
});

// Handle the 'disconnect' event
socket.on('disconnect', () => {
// Remove the user from the users object
delete users[currentUser.id];
// Broadcast the updated user list to all connected clients
io.emit('userList', Object.values(users));
});
});

// Initialize the admin UI for Socket.IO
instrument(io, { auth: false });

httpServer.listen(port, () => {
console.log(`Server listening on port ${port}`);
});