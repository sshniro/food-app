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
            query = 'SELECT drivers.id, users.username, drivers.location_address, drivers.location_latitude, drivers.location_longitude, drivers.availability, drivers.rating FROM drivers INNER JOIN users ON drivers.id = users.id ORDER BY drivers.id ASC;';
        }else{
            query = 'SELECT drivers.id, users.username, drivers.location_address, drivers.location_latitude, drivers.location_longitude, drivers.availability, drivers.rating FROM drivers INNER JOIN users ON drivers.id = users.id WHERE users.username = \'' + driverId + '\';';
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

        let query = 'SELECT drivers.id, users.username, drivers.location_address, drivers.location_latitude, drivers.location_longitude, drivers.availability, drivers.rating FROM drivers INNER JOIN users ON drivers.id = users.id WHERE users.username IN (', i;

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

        let salt = bcrypt.genSaltSync(baseConfig.saltRounds)

        let quesry = 'INSERT INTO users(username, password, role) values(\'' + driverInfo.username + '\', \'' + bcrypt.hashSync(driverInfo.password, salt) + '\', \'driver\') RETURNING id, username';

        postgreSQLService.queryExecutor(quesry).then(function (queryResponse) {
            if(queryResponse.rowCount > 0){

                let queryPrefix = 'INSERT INTO drivers(id', queryPostfix = ') values(' + queryResponse.rows[0].id, addToRedis = false;

                if(driverInfo.location_address){
                    queryPrefix = queryPrefix.concat(', location_address');
                    queryPostfix = queryPostfix.concat(', \'' + driverInfo.location_address + '\'');
                }

                if(driverInfo.location_latitude && driverInfo.location_longitude){
                    addToRedis = true;
                    queryPrefix = queryPrefix.concat(', location_latitude, location_longitude');
                    queryPostfix = queryPostfix.concat(', ' + driverInfo.location_latitude + ', ' + driverInfo.location_longitude);
                }

                if(driverInfo.driver_availability){
                    queryPrefix = queryPrefix.concat(', availability');
                    queryPostfix = queryPostfix.concat(', \'' + driverInfo.driver_availability + '\'');
                }

                if(driverInfo.driver_rating){
                    queryPrefix = queryPrefix.concat(', rating');
                    queryPostfix = queryPostfix.concat(', \'' + driverInfo.driver_rating + '\'');
                }

                queryPostfix = queryPostfix.concat(') RETURNING id;');

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

            }
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

            if(response.data.length > 0){

                let temp = response.data[0];

                for(let key in driverInfo) temp[key] = driverInfo[key];

                let query = 'UPDATE drivers SET location_address = \'' + temp.location_address + '\', location_latitude = \'' + temp.location_latitude + '\', location_longitude = \'' + temp.location_longitude + '\', availability = \'' + temp.driver_availability + '\', rating = ' + temp.driver_rating + ' WHERE ID = ' + temp.id + ' RETURNING id;';

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

            }else return reject({success: false, message: 'No diver Found driver'});

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}