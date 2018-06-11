'use strict';

const express = require('express');
const router = express.Router();

const driverUtilHelper = require('../driverUtilHelper.js');

/* GET driver listing from destination */
router.get('/', function(req, res, next) {

    let destinationJson = {
        orderId : req.query.orderId || 'testId1',
        origin: req.query.origin || '6.850740,79.873541',
        destination: req.query.destination || '6.794126,79.908880'
    };

    driverUtilHelper.getDriverGroupedByDistanceAndSortByRating(destinationJson).then(function (driverUtilHelperResponse) {
        res.status(200).json(driverUtilHelperResponse);
    }).catch(function (err) {
        console.log(err);
        res.status(500).send(err);
    });

});

module.exports = router;
