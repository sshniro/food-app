'use strict';

const express = require('express');
const router = express.Router();

const driverUtilHelper = require('../driverUtilHelper.js');
const mapsUtilHelper = require('../mapsUtilHelper.js');

/* GET driver listing from destination */
router.get('/', function(req, res, next) {

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
