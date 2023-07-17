// controllers/userController.js
const User = require('../models/user');

exports.join = async (req, res) => {
try {
const { username, password, name, roles } = req.body;
const newUser = await User.create(username, password, name, roles);
res.json(newUser);
} catch (err) {
console.error(err.message);
}
};

exports.login = (req, res) => {
const { user } = req;
res.status(200).json({
statusCode: 200,
user: user.username,
cookie: req.session.cookie,
message: 'Logged in successfully',
});
};

exports.logout = (req, res) => {
try {
req.logout(() => {
console.log('User logged out');
}); // Dummy callback function
res.status(200).json({
statusCode: 200,
message: 'Logged out successfully',
});
} catch (error) {
console.error('Error logging out:', error);
res.status(500).json({
statusCode: 500,
message: 'Error logging out',
});
}
};

