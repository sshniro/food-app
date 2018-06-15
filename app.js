const createError = require('http-errors');
const express = require('express');
const router = express.Router();
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const pg = require('pg');
const fs = require('fs');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const driversRouter = require('./routes/drivers');
const ordersRouter = require('./routes/orders');
const googleMapsRouter = require('./routes/google-maps');
const baseConfig = require('./config/baseConfig.js');
const geo_helper = require('./geo-helper.js');
const driverUtilHelper = require('./driverUtilHelper.js');
const authenticationProvider = require('./providers/authenticationProvider.js');

const connectionString = process.env.DATABASE_URL || baseConfig.dataaseURL;
const client = new pg.Client(connectionString);

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(authenticationProvider.authorizeDriverV2);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/drivers', driversRouter);
app.use('/maps', googleMapsRouter);
app.use('/orders', ordersRouter);

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


// geo_helper.addLocationsToRedis(geo_helper.locationSet).then(e => console.log('Successfully initialized drivers.'));

// geo_helper.addLocationsToRedis(geo_helper.locationSet).then(function (res) {
//     console.log('Successfully initialized drivers.');
//
//     for(let i = 0; i < geo_helper.destinationJsonSet.length; i += 1){
//         driverUtilHelper.findAvailableDrivers(geo_helper.destinationJsonSet[i], true).then(function (response) {
//             console.log(response);
//         }).catch(function (err) {
//             console.log(err);
//         });
//     }
// });

initDatabase();

console.log('UI: http://localhost:8080/food_app/index.html')
console.log('Google Maps API: GET http://localhost:8080/maps/distancematrix/')
console.log('Driver API: GET http://localhost:8080/drivers?orderId=testId2')
console.log('Order API: GET http://localhost:8080/orders?orderId=testId2')
console.log('Order API: POST http://localhost:8080/orders, JSON: { "orderId": "testId2", "driverId": "driver09-bekariya-junction" }')
console.log('Google API Key: GET http://localhost:8080/apiKey')

const PORT = process.env.PORT || 8080;

if (module === require.main) {
    // Start the server
    const server = app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
    });
}

function initDatabase(){

    client.connect();
    let sql = fs.readFileSync('./init_database.sql').toString();

    client.query(sql, function(err, result){
        if(err){
            console.log('error: ', err);
        }
        console.log('Database init Success;');
        client.end();
    });
}

module.exports = app;
