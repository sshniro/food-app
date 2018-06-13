'use strict';

const express = require('express');
const router = express.Router();

const authenticationProvider = require('../providers/authenticationProvider.js');
const driverQueryBuilderProvider = require('../providers/driverQueryBuilderProvider.js');
const driverUtilHelper = require('../driverUtilHelper.js');
const mapsUtilHelper = require('../mapsUtilHelper.js');


/* POST Authenticate driver */
router.post('/Authentication', function(req, res, next) {

    let auth = req.headers['authorization'];

    if(!auth){
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        return res.status(401).json({success: false, message: 'Need authorization to continue'});
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

    let driverId = req.query.driverId || '';

    driverQueryBuilderProvider.getDrivers(driverId).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

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

/* PUT Update driver by username */
router.put('/', function(req, res, next){

    let auth = req.headers['authorization'];
    let driverInfo = req.body || {};

    if(!auth){
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        return res.status(401).json({success: false, message: 'Need authorization to continue'});
    }else{

        authenticationProvider.authenticateDriver(auth).then(function (response) {

            driverInfo.auth = auth;
            driverQueryBuilderProvider.updateDriver(driverInfo).then(function (response) {
                return res.status(200).json(response);
            }).catch(function (err) {
                return res.status(500).json(err);
            });

        }).catch(function (err) {
            return res.status(401).json(err);
        });

    }

});

/* GET List all available drivers from origin (Restaurant) */
router.get('/available', function(req, res, next) {

    let destinationJson = {
        orderId : req.query.orderId || 'testId1',
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    mapsUtilHelper.calculateDistanceMatrixFromOriginsToDestinations(destinationJson).then(function (mapsUtilHelperResponse) {
        let result = {}, key;
        for(key in destinationJson) result[key] = destinationJson[key];
        for(key in mapsUtilHelperResponse) result[key] = mapsUtilHelperResponse[key];

        driverUtilHelper.getDriverGroupedByDistanceAndSortByRating(result).then(function (driverUtilHelperResponse) {
            let response = {
                success: true,
                data: driverUtilHelperResponse.row
            };
            // for(let key in driverUtilHelperResponse.destinationJson) response[key] = driverUtilHelperResponse.destinationJson[key];

            res.status(200).json(response);
        }).catch(function (err) {
            console.log(err);
            res.status(500).send(err);
        });

    }).catch(function (err) {
        res.status(500).send(err);
    });

});

/* POST Request available drivers from origin (Restaurant) */
router.post('/available', function(req, res, next) {

    let destinationJson = {
        orderId : req.query.orderId || 'testId1',
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    mapsUtilHelper.calculateDistanceMatrixFromOriginsToDestinations(destinationJson).then(function (mapsUtilHelperResponse) {
        let result = {}, key;
        for(key in destinationJson) result[key] = destinationJson[key];
        for(key in mapsUtilHelperResponse) result[key] = mapsUtilHelperResponse[key];

        driverUtilHelper.getDriverGroupedByDistanceAndSortByRating(result).then(function (driverUtilHelperResponse) {

            driverUtilHelper.notifyDrivers(driverUtilHelperResponse.row, driverUtilHelperResponse.destinationJson);

            res.status(200).json({status : 'Successfully notified the drivers.'});
        }).catch(function (err) {
            console.log(err);
            res.status(500).send(err);
        });

    }).catch(function (err) {
        res.status(500).send(err);
    });

});

module.exports = router;
