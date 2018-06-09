'use strict';

var express = require('express');
var router = express.Router();

var googleMapsProvider = require('../providers/googleMapsProvider.js');

/* GET users listing. */
router.get('/imperial', function(req, res, next) {

    var driversToDestination = {
        origins : req.query.origins || '40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271|40.598566,-73.7527626|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271|40.598566,-73.7527626',
        destinations : req.query.destinations || '40.6655101,-73.89188969999998'
    };

    console.log(driversToDestination)

    googleMapsProvider.calculateDistance(driversToDestination).then(function (googleMapsProviderResponse) {
        res.status(200).json(JSON.parse(googleMapsProviderResponse));
    }).catch(function (err) {
        res.status(500).send(err);
    });

});

module.exports = router;
