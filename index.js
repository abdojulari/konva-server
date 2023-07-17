const app = require('express')();
const httpServer = require('http').createServer(app);
const cors = require('cors');
const io = require('socket.io')(httpServer, {
  cors: {
    origin : 'http://localhost:4200',
    methods: ["GET", "POST"], 
    credentials: true, 
  },
});
const { instrument } = require("@socket.io/admin-ui");
const passport = require('passport');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const port = 3000;
const shapes = {}; // Store shapes on the server
const { Pool } = require('pg')
const dotenv = require('dotenv');
dotenv.config();
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

app.use(require('express').json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin : 'http://localhost:4200',
  methods: ["GET", "POST"],
  credentials: true,
}));
// Create a pool instance for connecting to the database
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const sessionMiddleware = session({
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
   }
});
app.use(sessionMiddleware);

// User model
const User = {
  // Find a user by username
  findByUsername: async (username) => {
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
  },
  // Find a user by id
  findById: async (id) => { 
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
  },
  // Verify user's password
  verifyPassword: function (user, password) {
    return bcrypt.compareSync(password, user.password);
  }
};


// Use the User model in Passport local strategy
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
// Serialize user
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      name: user.name,
    });
  });
});

// Deserialize user
passport.deserializeUser(function(user, cb) {
  const userData = User.findById(user.id);
  cb(null, userData)
});

app.use(passport.initialize());
app.use(passport.session());
// Use the cookie parser middleware
app.use(cookieParser());

app.post('/join', async (req, res) => {
  try {
    const { username, password, name, roles } = req.body;
    const newUser = await pool.query(
      "INSERT INTO users (username, password, name, roles) VALUES($1, $2, $3, $4) RETURNING *",
      [username, password, name, roles]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

  const authenticateUser = async (req, res, next) => {
    const AUTH_STRATEGY = 'local';
    try {
      await passport.authenticate(AUTH_STRATEGY,{ session: true}, (error, user, info) => {
          req.logIn(user, (error) => {
            if (error) {
              return res.status(401).json(error);
            }
            next();
          });
        })(req, res, next);
    } catch (error) {
      res.status(400).json({"statusCode" : 200 ,"message" : error});
    }
  };


app.post('/login', authenticateUser, (req, res)=> {
    users = {
      username: req.user.username,
      name: req.user.name,
      roles: req.user.roles,
    }
    res.status(200).json({
      "statusCode": 200,
      "user": req.user,
      "cookie": req.session.cookie,
      "message": "Logged in successfully",
    })
});

// logout 
app.get('/logout', (req, res) => {
  try {
    req.logout(() => {
      console.log('User logged out');
    }); // Dummy callback function
    res.status(200).json({
      "statusCode": 200,
      "message": "Logged out successfully",
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      "statusCode": 500,
      "message": "Error logging out",
    });
  }
});


//convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, socket.request.res, next);
// wrap passport middleware
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
// socket.io

io.use((socket, next) => {
  const user = socket?.request?.session?.passport?.user;
  if (!user) {
    return next(new Error('Authentication failed. Please provide a valid user.'));
  }
  next();
});


io.on('connection', (socket) => {
    const shapeTypes = ['Circle', 'Rect', 'Line', 'Arrow', 'Text'];

    const user = socket?.request?.session?.passport?.user?.name; 
    socket.user = user;
    console.log(socket)
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
      socket.broadcast.emit('bringToFront', data);
    });
  
    // Handle the 'sendToBack' event
    socket.on('sendToBack', (data) => {
      // Broadcast the action to all connected clients
      socket.broadcast.emit('sendToBack', data);
    });

    socket.on('deleteShape', (data) => {
      socket.broadcast.emit('deleteShape', data);
    })
    // Handle doubleClick event 
    socket.on('textUpdate', (data) => {
      // Broadcast the action to all connected clients
      io.emit('textUpdate', data);
    });

    // update real time text 
    
    socket.on('updateText', (data) => {
      // Broadcast the action to all connected clients
      io.emit('updateText', data);
    });
    // Send existing shapes to the newly connected client
    socket.emit('existingShapes', Object.values(shapes));

    socket.on('newImage', (imageData) => {
      // Broadcast the received image data to all connected clients
      io.emit('newImage', imageData);
    });

    socket.on('updateImage', (imageData) => {
      io.emit('updateImage', imageData);
    });

    socket.on('draw', (data) => {
      io.emit('draw', data); 
    });

    socket.on('erase', async (data) => {
      await io.emit('erase', data); 
    });

    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
      
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });

});

instrument(io, {
  auth: false,
  mode: "development",
});
httpServer.listen(port, () => console.log(`listening on port ${port}`));