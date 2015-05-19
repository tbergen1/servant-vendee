// Module Dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('cookie-session');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var Config = require('./config/config');
var robots = require('robots.txt');
var cors = require('cors');

// Set Environment from ENV variable or default to development
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load Local Environment Variables
if (env === 'development') {
    var dotenv = require('dotenv');
    dotenv.load();
}

// CookieParser should be above session
app.use(cookieParser());

// Session storage
app.use(session({
    name: process.env.SESSION_NAME, // Change these for your own application
    secret: process.env.SESSION_SECRET, // Change these for your own application
    secureProxy: false, // Set to true if you have an SSL Certificate
    cookie: {
        secure: false, // Secure is Recommeneded, However it requires an HTTPS enabled website (SSL Certificate)
        maxAge: 864000000, // 10 Days in miliseconds
        path: '/'
    },
    domain: process.env.NODE_ENV === 'production' ? '.servantpress.io' : '.lvh.me'
}));

// CORS
app.use(cors());

// Assets 
app.use('/assets', express.static(__dirname + '/public'));

// Set EJS as HTML as the template engine
app.set('views', './app/views');
app.set('view engine', 'ejs');

// Get req.body as JSON when receiving POST requests
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({
    extended: false
})); // parse application/x-www-form-urlencoded

// Override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

// Robots.txt
app.use(robots(__dirname + '/robots.txt'))

// Routes
require('./app/routes')(app); // pass our application into our routes

// Start Application
app.listen(process.env.PORT);
console.log('****** ' + Config.app.name + ': ' + env + ' is now running on port ' + process.env.PORT + '  ******');
exports = module.exports = app; // expose app



// End