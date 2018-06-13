const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const pg = require('pg');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const driversRouter = require('./routes/drivers');
const ordersRouter = require('./routes/orders');
const googleMapsRouter = require('./routes/google-maps');
const baseConfig = require('./config/baseConfig.js');
const geo_helper = require('./geo-helper.js');
const driverUtilHelper = require('./driverUtilHelper.js');

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
geo_helper.addLocationsToRedis(geo_helper.locationSet).then(function (res) {
    console.log('Successfully initialized drivers.')

    for(let i = 0; i < geo_helper.destinationJsonSet.length; i += 1){
        driverUtilHelper.findAvailableDrivers(geo_helper.destinationJsonSet[i], true).then(function (response) {
            console.log(response);
        }).catch(function (err) {
            console.log(err);
        });
    }
});



console.log('UI: http://localhost:3000/food_app/index.html')
console.log('Google Maps API: GET http://localhost:3000/maps/distancematrix/')
console.log('Driver API: GET http://localhost:3000/drivers?orderId=testId2')
console.log('Order API: GET http://localhost:3000/orders?orderId=testId2')
console.log('Order API: POST http://localhost:3000/orders, JSON: { "orderId": "testId2", "driverId": "driver09-bekariya-junction" }')
console.log('Google API Key: GET http://localhost:3000/apiKey')

const PORT = process.env.PORT || 3000;

if (module === require.main) {
    // Start the server
    const server = app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
    });
}

initDatabase();

function initDatabase(){

    const dropItemsTableSQLQuery = 'DROP TABLE drivers';
    const createItemsTableSQLQuery = 'CREATE TABLE drivers(\n' +
        '    ID serial NOT NULL PRIMARY KEY,\n' +
        '    username VARCHAR(20) UNIQUE, \n' +
        '    password VARCHAR(256) not null,\n' +
        '    location_address VARCHAR(255),\n' +
        '    location_latitude DOUBLE PRECISION,\n' +
        '    location_longitude DOUBLE PRECISION,\n' +
        '    driver_availability VARCHAR(20),\n' +
        '    driver_rating real)';

    // dropTable(dropItemsTableSQLQuery, createItemsTableSQLQuery);
}

function dropTable(dropQuery, createQuery){

    client.connect();
    const queryDropTable = client.query(dropQuery);

    queryDropTable.then(function (queryDropTableResponse) {
        createTable(createQuery);
    }).catch(function (err) {
        createTable(createQuery);
    });

}

function createTable(createQuery){

    const queryCreateTable = client.query(createQuery);

    queryCreateTable.then(function (queryCreateTableResponse) {
        console.log('Successfully created table');
        client.end();
    }).catch(function (err) {
        console.log(err);
        client.end();
    });

}

module.exports = app;