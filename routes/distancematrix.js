'use strict';

var express = require('express');
var router = express.Router();

var googleMapsProvider = require('../providers/googleMapsProvider.js');

/* GET users listing. */
router.get('/', function(req, res, next) {


    googleMapsProvider.calculateDistance('40.6655101', '-73.89188969999998', '40.6905615', '-73.9976592').then(function (googleMapsProviderResponse) {
        res.status(200).json(JSON.parse(googleMapsProviderResponse));
    }).catch(function (err) {
        res.status(500).send(err);
    });

});

module.exports = router;
