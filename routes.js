// routes.js
const express = require('express');
const router = express.Router();
const UserController = require('./controllers/userController');

router.post('/join', UserController.join);
router.post('/login', UserController.login);
router.get('/logout', UserController.logout);

module.exports = router;