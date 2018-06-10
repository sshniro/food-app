'use strict';

const express = require('express');
const sortJsonArray = require('sort-json-array');
const router = express.Router();

const googleMapsProvider = require('../providers/googleMapsProvider.js');
const geo_helper = require('../geo-helper.js');

/* GET users listing. */
router.get('/distancematrix', function(req, res, next) {

    let driversToDestination = {
        origins : req.query.origins || '40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271|40.598566,-73.7527626|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271',
        destinations : req.query.destinations || '40.6655101,-73.89188969999998|40.598566,-73.7527626'
    };

    googleMapsProvider.calculateDistance(driversToDestination).then(function (googleMapsProviderResponse) {

        let groups = [], i, j;

        for (i = 0; i < googleMapsProviderResponse.rows.length; i += 1) {

            for (j = 0; j < googleMapsProviderResponse.rows[i].elements.length; j += 1) {
                let tempJson = {};
                tempJson.origin_address = googleMapsProviderResponse.origin_addresses[i];
                tempJson.destination_address = googleMapsProviderResponse.destination_addresses[j];
                tempJson = Object.assign(tempJson, googleMapsProviderResponse.rows[i].elements[j]);
                groups.push(tempJson)
            }
        }

        // res.status(200).json(googleMapsProviderResponse);
        res.status(200).json(groups);
    }).catch(function (err) {
        res.status(500).send(err);
    });

});

module.exports = router;
