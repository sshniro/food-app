'use strict';

const express = require('express');
const sortJsonArray = require('sort-json-array');
const router = express.Router();

const googleMapsProvider = require('../providers/googleMapsProvider.js');
const geo_helper = require('../geo-helper.js');

const configs = require('../config/baseConfig')


router.get('/', function(req, res, next) {

    let destinationJson = {
        destination : req.query.destination || '6.850740,79.873541'
    };

    let destinationSplit = destinationJson.destination.split(',');

    geo_helper.getNearByVehicles(destinationSplit[0], destinationSplit[1]).then(function (geoHelperResponse) {

        let groups = [], i, previousIndex = 0, range = configs.driverGroupSegByDistanceVal;

        for (i = 0; i < geoHelperResponse.length; i += 1) {

            geoHelperResponse[i].rating = geo_helper.locationSet[geoHelperResponse[i].key].rating;
            if(geoHelperResponse[i].distance > range){
                if((geoHelperResponse[i].distance - range) < configs.driverGroupSegByDistanceVal){
                    groups.push(geoHelperResponse.slice(previousIndex, i));
                    previousIndex = i;
                    range += configs.driverGroupSegByDistanceVal;
                }else {
                    range += configs.driverGroupSegByDistanceVal;
                    i = i - 1;
                }
            }
            if(i + 1 === geoHelperResponse.length){
                groups.push(geoHelperResponse.slice(previousIndex, i + 1));
            }
        }

        // sort the segmented group by distance using the drivers rating
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
