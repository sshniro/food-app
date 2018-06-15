'use strict';

const express = require('express');
const router = express.Router();

const authenticationProvider = require('../providers/authenticationProvider.js');
const driverQueryBuilderProvider = require('../providers/driverQueryBuilderProvider.js');
const driverUtilHelper = require('../driverUtilHelper.js');
const driverHelperProvider = require('../providers/driverHelperProvider');

/* POST Authenticate driver */
router.post('/Authentication', function(req, res, next) {

    let auth = req.body || {};

    if(!auth.username || !auth.password){
        return res.status(401).json({success: false, message: 'Username or password missing'});
    }else{

        authenticationProvider.authenticateDriver(auth).then(function (response) {
            return res.status(200).json(response);
        }).catch(function (err) {
            return res.status(401).json(err);
        });

    }

});

/* GET Get all drivers || Get driver by username */
router.get('/', function(req, res, next){

    let token = req.headers['x-access-token'];
    let driverId = req.query.driverId || '';

    if(!token){
        res.setHeader('WWW-Authenticate', 'x-access-token="Secure Area"');
        return res.status(401).json({success: false, message: 'Need authorization to continue'});
    }else{

        driverQueryBuilderProvider.getDrivers(driverId).then(function (response) {
            return res.status(200).json(response);
        }).catch(function (err) {
            return res.status(500).json(err);
        });

    }

});

/* POST Add a new driver */
router.post('/', function(req, res, next){

    let driverInfo = req.body || {};

    driverQueryBuilderProvider.insertDriver(driverInfo).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

/* POST Batch add a new driver */
router.post('/batch', function(req, res, next){

    let driverInfoSet = req.body || {}, i, promiseArr = [];

    for(i = 0; i < driverInfoSet.drivers.length; i += 1){
        promiseArr.push(driverQueryBuilderProvider.insertDriver(driverInfoSet.drivers[i]));
    }

    Promise.all(promiseArr).then(function(response) {
        return res.status(200).json({success: true, data: response});
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

/* PUT Update driver by username */
router.put('/', function(req, res, next){

    let token = req.headers['x-access-token'];
    let driverInfo = req.body || {};

    if(!token){
        res.setHeader('WWW-Authenticate', 'x-access-token="Secure Area"');
        return res.status(401).json({success: false, message: 'Need authorization to continue'});
    }else{

        authenticationProvider.authorizeDriver(token).then(function (response) {

            driverQueryBuilderProvider.updateDriver(response.data.username, driverInfo).then(function (response) {
                return res.status(200).json(response);
            }).catch(function (err) {
                return res.status(500).json(err);
            });

        }).catch(function (err) {
            return res.status(401).json(err);
        });

    }

});

/* ***************************              Need to implement available drivers With SQL DB                 *************************** */
router.get('/v2/available', function(req, res, next) {

    let destinationJson = {
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    driverHelperProvider.findAvailableDrivers(destinationJson, false).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

router.post('/v2/available', function(req, res, next) {

    let destinationJson = {
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    driverHelperProvider.findAvailableDrivers(destinationJson, true).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});


/* ***************************              Old With JSON               *************************** */

/* GET List all available drivers from origin (Restaurant) */
router.get('/available', function(req, res, next) {

    let destinationJson = {
        orderId : req.query.orderId || 'testId1',
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    driverUtilHelper.findAvailableDrivers(destinationJson, false).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

/* POST Request available drivers from origin (Restaurant) */
router.post('/available', function(req, res, next) {

    let destinationJson = {
        orderId : req.query.orderId || 'testId1',
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    driverUtilHelper.findAvailableDrivers(destinationJson, true).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

module.exports = router;
