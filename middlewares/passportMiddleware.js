// middlewares/passportMiddleware.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user');

passport.use(
new LocalStrategy(async function (username, password, done) {
try {
const user = await User.findByUsername(username);
if (!user) {
return done(null, false); // User not found
}
const isPasswordValid = User.verifyPassword(user, password);
if (!isPasswordValid) {
return done(null, false); // Invalid password
}
return done(null, user); // Authentication successful
} catch (err) {
return done(err); // Error during authentication
}
})
);

passport.serializeUser(function (user, cb) {
process.nextTick(function () {
return cb(null, {
id: user.id,
username: user.username,
name: user.name,
});
});
});

passport.deserializeUser(function (id, cb) {
const user = User.findById(id);
cb(null, user);
});

module.exports = passport;