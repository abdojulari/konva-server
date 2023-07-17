// utils/socketAuthenticationMiddleware.js
const sessionMiddleware = require('../middlewares/sessionMiddleware');
const passport = require('../config/passport');

module.exports = (socket, next) => {
sessionMiddleware(socket.request, socket.request.res, () => {
passport.initialize()(socket.request, socket.request.res, () => {
passport.session()(socket.request, socket.request.res, () => {
next();
});
});
});
};