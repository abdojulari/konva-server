// socket.js
const io = require('socket.io');
const sessionMiddleware = require('./middlewares/sessionMiddleware');
const passportMiddleware = require('./middlewares/passportMiddleware');
const authenticationMiddleware = require('./middlewares/authenticationMiddleware');
const {
handleShapeEvents,
handleTextEvents,
handleImageEvents,
handleDrawEvents,
handleEraseEvents,
handleChatEvents,
handleConnection,
handleDisconnection,
} = require('./socketEvents');

module.exports = (httpServer) => {
const socketIO = io(httpServer);

socketIO.use(sessionMiddleware);
socketIO.use(passportMiddleware.initialize());
socketIO.use(passportMiddleware.session());
socketIO.use(authenticationMiddleware);

socketIO.on('connection', handleConnection);

socketIO.on('create', handleShapeEvents.create);
socketIO.on('update', handleShapeEvents.update);
socketIO.on('bringToFront', handleShapeEvents.bringToFront);
socketIO.on('sendToBack', handleShapeEvents.sendToBack);

socketIO.on('textUpdate', handleTextEvents.update);

socketIO.on('newImage', handleImageEvents.newImage);
socketIO.on('updateImage', handleImageEvents.updateImage);

socketIO.on('draw', handleDrawEvents.draw);
socketIO.on('erase', handleEraseEvents.erase);

socketIO.on('chat message', handleChatEvents.message);

socketIO.on('disconnect', handleDisconnection);

return socketIO;
};