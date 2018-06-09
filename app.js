var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var redis = require("redis"),
    client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
    console.log("Error " + err);
});

var geo = require('georedis').initialize(client);

var locationSet = {
    'Toronto': {latitude: 43.6667, longitude: -79.4167},
    'Philadelphia': {latitude: 39.9523, longitude: -75.1638},
    'Palo Alto': {latitude: 37.4688, longitude: -122.1411},
    'San Francisco': {latitude: 37.7691, longitude: -122.4449},
    'St. John\'s': {latitude: 47.5500, longitude: -52.6667},
    'New York': {latitude: 40.7143, longitude: -74.0060},
    'Twillingate': {latitude: 49.6500, longitude: -54.7500},
    'Ottawa': {latitude: 45.4167, longitude: -75.7000},
    'Calgary': {latitude: 51.0833, longitude: -114.0833},
    'Mumbai': {latitude: 18.9750, longitude: 72.8258}
};

geo.addLocations(locationSet, function (err, reply) {
    if (err) console.error(err)
    else console.log('added locations:', reply)
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
