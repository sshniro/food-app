'use strict';

const sha256 = require('sha256')

const driverService = require('../services/driverService.js');

module.exports = {
    getDrivers: getDrivers,
    insertDriver: insertDriver,
    updateDriver: updateDriver
};

function getDrivers(driverId){

    return new Promise(function (resolve, reject) {

        let query;

        if(driverId === ''){
            query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability FROM drivers ORDER BY id ASC;';
        }else{
            query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability FROM drivers WHERE username = \'' + driverId + '\';';
        }

        driverService.queryExecutor(query).then(function (queryResponse) {
            return resolve({success: true, data: queryResponse.rows});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function insertDriver(driverInfo){

    return new Promise(function (resolve, reject) {

        let queryPrefix = 'INSERT INTO drivers(', queryPostfix = ') values(';

        if(driverInfo.username && driverInfo.password){
            queryPrefix = queryPrefix.concat('username, password');
            queryPostfix = queryPostfix.concat('\'' + driverInfo.username + '\', \'' + sha256(driverInfo.password) + '\'');
        } else{
            console.log('Username or password missing');
            return reject({success: false, message: 'Username or password missing'});
        }

        if(driverInfo.location_address && driverInfo.location_latitude && driverInfo.location_longitude){
            queryPrefix = queryPrefix.concat(', location_address, location_latitude, location_longitude');
            queryPostfix = queryPostfix.concat(', \'' + driverInfo.location_address + '\', ' + driverInfo.location_latitude + ', ' + driverInfo.location_longitude);
        }

        if(driverInfo.driver_availability){
            queryPrefix = queryPrefix.concat(', driver_availability');
            queryPostfix = queryPostfix.concat(', \'' + driverInfo.driver_availability + '\'');
        }

        queryPostfix = queryPostfix.concat(');');


        driverService.queryExecutor(queryPrefix + queryPostfix).then(function (queryResponse) {
            return resolve({success: true, data: queryResponse});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}


function updateDriver(driverInfo){

    return new Promise(function (resolve, reject) {

        let tmp = driverInfo.auth.split(' ');
        let buf = new Buffer(tmp[1], 'base64');
        let plain_auth = buf.toString();
        let creds = plain_auth.split(':');

        getDrivers(creds[0]).then(function (response) {

            let queryPrefix = 'UPDATE drivers SET ';

            if(driverInfo.location_address && driverInfo.location_latitude && driverInfo.location_longitude){
                queryPrefix = queryPrefix.concat('location_address = \'' + driverInfo.location_address + '\', location_latitude = ' + driverInfo.location_latitude + ', location_longitude = ' + driverInfo.location_longitude);

                if(driverInfo.driver_availability){
                    queryPrefix = queryPrefix.concat(', driver_availability = \'' + driverInfo.driver_availability + '\'');
                }

            }else{
                queryPrefix = queryPrefix.concat('driver_availability = \'' + driverInfo.driver_availability + '\'');
            }

            queryPrefix = queryPrefix.concat(' WHERE ID = ' + response.data[0].id) + ';';

            driverService.queryExecutor(queryPrefix).then(function (queryResponse) {
                return resolve({success: true, data: queryResponse});
            }).catch(function (err) {
                console.log(err);
                return reject({success: false, message: err});
            });

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}