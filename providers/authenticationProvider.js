'use strict';

const sha256 = require('sha256')

const driverService = require('../services/driverService.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const baseConfig = require('../config/baseConfig.js');

module.exports = {
    authenticateDriver: authenticateDriver,
    authorizeDriver: authorizeDriver
};

function authenticateDriver(auth){

    return new Promise(function (resolve, reject) {

        auth.hashedPassword = bcrypt.hashSync(auth.password, baseConfig.saltRounds);

        let query = 'SELECT * FROM drivers WHERE username = \'' + auth.username + '\';';

        // console.log(query);

        driverService.queryExecutor(query).then(function (queryResponse) {

            if(queryResponse.rowCount > 0){

                let passwordIsValid = bcrypt.compareSync(auth.password, queryResponse.rows[0].password)

                if(!passwordIsValid) reject({success: false, message: 'Username or password wrong'});

                let token = jwt.sign({ id: auth.username }, baseConfig.secret, {
                    expiresIn: 86400 // 24 hours
                });

                return resolve({success: true, message: 'Authorization Successful', token: token});
            }else{
                return reject({success: false, message: 'Username or password wrong'});
            }

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function authorizeDriver(token){

    return new Promise(function (resolve, reject) {

        jwt.verify(token, baseConfig.secret, function(err, decoded) {
            if (err) return reject({ authentication: false, message: 'Failed to authenticate token.' });

            let query = 'SELECT ID, username, location_address, location_latitude, location_longitude, driver_availability FROM drivers WHERE username = \'' + decoded.id + '\';';

            driverService.queryExecutor(query).then(function (queryResponse) {

                if(queryResponse.rowCount > 0){
                    return resolve({success: true, message: 'Authorization Successful', data: queryResponse.rows[0]});
                }else{
                    return reject({success: false, message: 'No user found.'});
                }

            }).catch(function (err) {
                console.log(err);
                return reject({success: false, message: 'There was a problem finding the user.'});
            });

        });

    });
}
