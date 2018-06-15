'use strict';

const driverService = require('../services/postgreSQLService.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const baseConfig = require('../config/baseConfig.js');

module.exports = {
    authenticateDriver: authenticateDriver,
    authorizeDriver: authorizeDriver,
    authorizeDriverV2: authorizeDriverV2,
    permit: permit
};

function authenticateDriver(auth){

    return new Promise(function (resolve, reject) {

        auth.hashedPassword = bcrypt.hashSync(auth.password, baseConfig.saltRounds);

        let query = 'SELECT * FROM users WHERE username = \'' + auth.username + '\';';

        driverService.queryExecutor(query).then(function (queryResponse) {

            if(queryResponse.rowCount > 0){

                let passwordIsValid = bcrypt.compareSync(auth.password, queryResponse.rows[0].password);

                if(!passwordIsValid) reject({success: false, message: 'Username or password wrong'});

                let token = jwt.sign({ id: auth.username }, baseConfig.secret, {
                    expiresIn: baseConfig.jwtTokenExpireTime
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

            let query = 'SELECT * FROM users WHERE username = \'' + decoded.id + '\';';

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

function authorizeDriverV2(req, res, next){

    let token = req.headers['x-access-token'] || '';

    if(!token){
        req.user = {role: 'user'};
        next();
    }else{

        authorizeDriver(token).then(function (response) {
            req.user = {role: response.data.role, username: response.data.username, id: response.data.id};
            next();
        }).catch(function (err) {
            res.status(401).json(err);
        });

    }

}

function permit(...allowed) {
    const isAllowed = role => allowed.indexOf(role) > -1;

    return (req, res, next) => {
        if (req.user && isAllowed(req.user.role))
            next();
        else {
            res.setHeader('WWW-Authenticate', 'x-access-token="Secure Area"');
            return res.status(401).json({success: false, message: 'Need authorization to continue'});
        }
    }
}