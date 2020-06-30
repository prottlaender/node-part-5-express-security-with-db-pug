// secserver.js

// hTTP module
const http = require('http');
// express module
const express = require('express');
// hTTP header security module
const helmet = require('helmet');
// envy module to manage environment variables
const envy = require('envy');
// server side session and cookie module
const session = require('express-session');
// mongodb session storage module
const connectMdbSession = require('connect-mongodb-session');

// load user controller
const userController = require('./database/controllers/userC');

// set the environment variables
const env = envy()
const port = env.port
const mongodbpath = env.mongodbpath
const sessionsecret = env.sessionsecret
const sessioncookiename = env.sessioncookiename

// load StartMongoServer function from db configuration file
const StartMongoServer = require('./database/db');
// start MongoDB server
StartMongoServer();

// Create MongoDB session storage object
const MongoDBStore = connectMdbSession(session)

// create new session store in mongodb
const store = new MongoDBStore({
  uri: mongodbpath,
  collection: 'col_sessions'
});

// catch errors in case store creation fails
store.on('error', function(error) {
  console.log(`error store session in session store: ${error.message}`);
});

// Create the express app
const app = express();

// Set the ip-address of your trusted reverse proxy server (nginx)
// The proxy server should insert the ip address of the remote client
// through request header 'X-Forwarded-For' as
// 'X-Forwarded-For: some.client.ip.address'
// Insertion of the forward header is an option on most proxy software
app.set('trust proxy', '192.168.178.20')
// use Pug Template Engine
app.set('view engine', 'pug')
app.set('views', './views')

// use secure HTTP headers using helmet
app.use(helmet())
// use express.static file folder in the root of the app
app.use(express.static('static'));
// use express.urlencoded to parse incomming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));
// use session to create session and session cookie
app.use(session({
  secret: sessionsecret,
  name: sessioncookiename,
  store: store,
  resave: false,
  saveUninitialized: false,
  // set cookie to 1 week maxAge
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: true
  },

}));

// middleware to redirect authenticated users to their dashboard
const redirectDashboard = (req, res, next) => {
  if (req.session.userData) {
    res.redirect('/dashboard')

  } else {
    next()
  }
}

// middleware to redirect not authenticated users to login
const redirectLogin = (req, res, next) => {
  if (!req.session.userData) {
    res.redirect('/login')
  } else {
    next()
  }
}

// For each navigation link create get routes and send HTML to the Browser
app.get('/', (req, res) => {
  res.render('home', {
      title: 'Home Page (PUG)'
    });
});

app.get('/login', redirectDashboard, (req, res) => {
  res.render('login', {
      title: 'Login Page (PUG)'
    });
});

app.get('/register', redirectDashboard, (req, res) => {
  res.render('register', {
      title: 'Registration Page (PUG)'
    });
});

app.get('/dashboard', redirectLogin, (req, res) => {
  res.render('dashboard', {
      title: 'Dashboard Page (PUG)',
      name: req.session.userData.name,
      lastname: req.session.userData.lastname,
      role: req.session.userData.role
    });
});

app.get('/logout', redirectLogin, (req, res) => {
  req.session.destroy(function(err) {
    if (err) {
      res.send('An err occured: ' +err.message);
    } else {
      res.clearCookie('express_session_pug').redirect('/')
    }
  });

})

// Post routes to manage user login and user registration
app.post('/login', userController.loginUser);

app.post('/register', userController.createUser);

// Browsers will by default try to request /favicon.ico from the
// root of a hostname, in order to show an icon in the browser tab.
// To avoid that requests returning a 404 (Not Found)
// The favicon.ico request will be catched and send a 204 No Content status
app.get('/favicon.ico', function(req, res) {
    console.log(req.url);
    res.status(204).json({status: 'no favicon'});
});

// create server
const server = http.createServer(app)

// connect server to port
server.listen(port)

console.log(`express secure server (pug version) start successful on port ${port}`)
