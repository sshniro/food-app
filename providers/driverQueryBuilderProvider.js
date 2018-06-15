'use strict';

const postgreSQLService = require('../services/postgreSQLService.js');
const geo_helper = require('../geo-helper.js');
const bcrypt = require('bcryptjs');
const baseConfig = require('../config/baseConfig.js');

module.exports = {
    getDrivers: getDrivers,
    getDriversBYIDs: getDriversBYIDs,
    insertDriver: insertDriver,
    updateDriver: updateDriver
};

function getDrivers(driverId){

    return new Promise(function (resolve, reject) {

        let query;

        if(driverId === ''){
            query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability, driver_rating FROM drivers ORDER BY id ASC;';
        }else{
            query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability, driver_rating FROM drivers WHERE username = \'' + driverId + '\';';
        }

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
            return resolve({success: true, data: queryResponse.rows});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function getDriversBYIDs(driverIdArr){

    return new Promise(function (resolve, reject) {

        let query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability, driver_rating FROM drivers WHERE username IN (', i;

        for(i = 0; i < driverIdArr.length; i += 1){
            query = query.concat('\'' + driverIdArr[i] + '\'');

            if(i + 1 !== driverIdArr.length) query = query.concat(', ');
        }

        query = query.concat(');');

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
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

        queryPostfix = queryPostfix.concat(') RETURNING id, username;');

        postgreSQLService.queryExecutor(queryPrefix + queryPostfix).then(function (queryResponse) {

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

            if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows[0]});
            else return reject({success: false, message: 'Failed to insert driver'});

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}


function updateDriver(username, driverInfo){

    return new Promise(function (resolve, reject) {

        getDrivers(username).then(function (response) {

            let temp = response.data[0];
            for(let key in driverInfo) temp[key] = driverInfo[key];

            let query = 'UPDATE drivers SET location_address = \'' + temp.location_address + '\', location_latitude = \'' + temp.location_latitude + '\', location_longitude = \'' + temp.location_longitude + '\', driver_availability = \'' + temp.driver_availability + '\', driver_rating = ' + temp.driver_rating + ' WHERE ID = ' + temp.id + ' RETURNING id, username;';

            postgreSQLService.queryExecutor(query).then(function (queryResponse) {

                if(queryResponse.rowCount > 0) {
                    let redisJson = {
                        key: temp.username,
                        body: {
                            latitude: temp.location_latitude,
                            longitude: temp.location_longitude
                        }
                    };
                    geo_helper.addLocationToRedis(redisJson).then(e => console.log('Successfully Updated driver to redis.'));

                    return resolve({success: true, data: queryResponse.rows[0]});
                } else return reject({success: false, message: 'Failed to update driver'});

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