'use strict';

var express = require('express');
var sortJsonArray = require('sort-json-array');
var router = express.Router();

var googleMapsProvider = require('../providers/googleMapsProvider.js');
var geo_helper = require('../geo-helper.js');

/* GET users listing. */
router.get('/', function(req, res, next) {

    var driversToDestination = {
        origins : req.query.origins || '40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.6905615,-73.9976592|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271|40.598566,-73.7527626|40.659569,-73.933783|40.729029,-73.851524|40.6860072,-73.6334271|40.598566,-73.7527626',
        destinations : req.query.destinations || '40.6655101,-73.89188969999998'
    };

    googleMapsProvider.calculateDistance(driversToDestination).then(function (googleMapsProviderResponse) {
        res.status(200).json(JSON.parse(googleMapsProviderResponse));
    }).catch(function (err) {
        res.status(500).send(err);
    });

});

router.get('/drivers', function(req, res, next) {

    var destinationJson = {
        destination : req.query.destination || '6.850740,79.873541'
    };

    var destinationSplit = destinationJson.destination.split(',');

    geo_helper.getNearByVehicles(destinationSplit[0], destinationSplit[1]).then(function (geoHelperResponse) {

        var groups = [], i, previousIndex = 0, range = 500;

        for (i = 0; i < geoHelperResponse.length; i += 1) {

            geoHelperResponse[i].rating = geo_helper.locationSet[geoHelperResponse[i].key].rating;

            if(geoHelperResponse[i].distance > range){

                if((geoHelperResponse[i].distance - range) < 500){
                    groups.push(geoHelperResponse.slice(previousIndex, i));
                    previousIndex = i;
                    range += 500;
                }else {
                    range += 500;
                    i = i - 1;
                }

            }

            if(i + 1 === geoHelperResponse.length){ groups.push(geoHelperResponse.slice(previousIndex, i + 1)); }

        }

        for (i = 0; i < groups.length; i += 1) {
            groups[i] = sortJsonArray(groups[i], 'rating', 'des');
        }

        res.status(200).json({row : groups});


    }).catch(function (err) {
        console.log(err);
        res.status(500).send(err);
    });

});

module.exports = router;
