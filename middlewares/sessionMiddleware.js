// middlewares/sessionMiddleware.js
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
user: process.env.PGUSER,
host: process.env.PGHOST,
database: process.env.PGDATABASE,
password: process.env.PGPASSWORD,
port: process.env.PGPORT,
});

module.exports = session({
store: new pgSession({
pool: pool,
tableName: 'user_session',
sidName: 'sid',
}),
secret: process.env.SECRET,
resave: false,
saveUninitialized: false,
cookie: {
maxAge: 24 * 60 * 60 * 1000,
httpOnly: true,
expires: 24 * 60 * 60 * 1000,
},
});