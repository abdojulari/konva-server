// middlewares/authenticationMiddleware.js
module.exports = (socket, next) => {
    const session = socket.request.session;
    if (!session) {
    return next(new Error('Authentication failed. Please provide a valid session.'));
    }
    next();
    };