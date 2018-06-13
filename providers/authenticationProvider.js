'use strict';

const sha256 = require('sha256')

const driverService = require('../services/driverService.js');

module.exports = {
    authenticateDriver: authenticateDriver
};

function authenticateDriver(auth){

    return new Promise(function (resolve, reject) {

        let tmp = auth.split(' ');
        let buf = new Buffer(tmp[1], 'base64');
        let plain_auth = buf.toString();
        let creds = plain_auth.split(':');

        let query = 'SELECT ID FROM drivers WHERE username = \'' + creds[0] + '\' AND password = \'' + sha256(creds[1]) + '\';';

        driverService.queryExecutor(query).then(function (queryResponse) {

            if(queryResponse.rowCount > 0){
                return resolve({success: true, message: 'Authorization Successful'});
            }else{
                return reject({success: false, message: 'Authorization Failed'});
            }

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}
