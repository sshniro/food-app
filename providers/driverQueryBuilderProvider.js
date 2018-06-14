'use strict';

const driverService = require('../services/driverService.js');
const geo_helper = require('../geo-helper.js');
const bcrypt = require('bcryptjs');
const baseConfig = require('../config/baseConfig.js');

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

        let queryPrefix = 'INSERT INTO drivers(', queryPostfix = ') values(', addToRedis = false, salt = bcrypt.genSaltSync(baseConfig.saltRounds);;

        if(driverInfo.username && driverInfo.password){
            queryPrefix = queryPrefix.concat('username, password');
            queryPostfix = queryPostfix.concat('\'' + driverInfo.username + '\', \'' + bcrypt.hashSync(driverInfo.password, salt) + '\'');
        } else{
            console.log('Username or password missing');
            return reject({success: false, message: 'Username or password missing'});
        }

        if(driverInfo.location_address && driverInfo.location_latitude && driverInfo.location_longitude){
            addToRedis = true;
            queryPrefix = queryPrefix.concat(', location_address, location_latitude, location_longitude');
            queryPostfix = queryPostfix.concat(', \'' + driverInfo.location_address + '\', ' + driverInfo.location_latitude + ', ' + driverInfo.location_longitude);
        }else {
            console.log('Location information missing');
            return reject({success: false, message: 'Location information missing'});
        }

        if(driverInfo.driver_availability){
            queryPrefix = queryPrefix.concat(', driver_availability');
            queryPostfix = queryPostfix.concat(', \'' + driverInfo.driver_availability + '\'');
        }

        if(driverInfo.driver_rating){
            queryPrefix = queryPrefix.concat(', driver_rating');
            queryPostfix = queryPostfix.concat(', \'' + driverInfo.driver_rating + '\'');
        }

        queryPostfix = queryPostfix.concat(');');


        driverService.queryExecutor(queryPrefix + queryPostfix).then(function (queryResponse) {

            if(addToRedis){
                let redisJson = {
                    key: driverInfo.username,
                    body: {
                        latitude: driverInfo.location_latitude,
                        longitude: driverInfo.location_longitude
                    }
                };
                geo_helper.addLocationToRedis(redisJson).then(e => console.log('Successfully added driver to redis.'));
            }

            return resolve({success: true, data: queryResponse});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}


function updateDriver(username, driverInfo){

    return new Promise(function (resolve, reject) {

        getDrivers(username).then(function (response) {

            let queryPrefix = 'UPDATE drivers SET ';

            if(driverInfo.location_address && driverInfo.location_latitude && driverInfo.location_longitude){
                queryPrefix = queryPrefix.concat('location_address = \'' + driverInfo.location_address + '\', location_latitude = ' + driverInfo.location_latitude + ', location_longitude = ' + driverInfo.location_longitude);

                if(driverInfo.driver_availability){
                    queryPrefix = queryPrefix.concat(', driver_availability = \'' + driverInfo.driver_availability + '\'');
                }

                if(driverInfo.driver_rating){
                    queryPrefix = queryPrefix.concat(', driver_rating = ' + driverInfo.driver_rating);
                }

            }else {

                let temp = response.data[0];
                for(let key in driverInfo) temp[key] = driverInfo[key];

                queryPrefix = queryPrefix.concat('driver_availability = \'' + response.data[0].driver_availability + '\'');
                queryPrefix = queryPrefix.concat(', driver_rating = ' + response.data[0].driver_rating);
            }

            queryPrefix = queryPrefix.concat(' WHERE ID = ' + response.data[0].id) + ';';

            driverService.queryExecutor(queryPrefix).then(function (queryResponse) {

                let redisJson = {
                    key: driverInfo.username,
                    body: {
                        latitude: driverInfo.location_latitude,
                        longitude: driverInfo.location_longitude
                    }
                };
                geo_helper.addLocationToRedis(redisJson).then(e => console.log('Successfully Updated driver to redis.'));

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