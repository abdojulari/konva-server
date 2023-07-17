// models/user.js
const bcrypt = require('bcrypt');
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

class User {
static async create(username, password, name, roles) {
const hashedPassword = await bcrypt.hash(password, 10);
const newUser = await pool.query(
'INSERT INTO users (username, password, name, roles) VALUES($1, $2, $3, $4) RETURNING *',
[username, hashedPassword, name, roles]
);
return newUser.rows[0];
}

static async findByUsername(username) {
const query = 'SELECT * FROM users WHERE username = $1';
const values = [username];
try {
const result = await pool.query(query, values);
if (result.rows.length > 0) {
return result.rows[0]; // Return the first user found
} else {
return null; // Return null if user not found
}
} catch (err) {
console.error('Error finding user:', err);
throw err;
}
}

static async findById(id) {
const query = 'SELECT * FROM users WHERE id = $1';
const values = [id];
try {
const result = await pool.query(query, values);
if (result.rows.length > 0) {
return result.rows[0]; // Return the first user found
} else {
return null; // Return null if user not found
}
} catch (err) {
console.error('Error finding user:', err);
throw err;
}
}

static verifyPassword(user, password) {
return bcrypt.compareSync(password, user.password);
}
}

module.exports = User;