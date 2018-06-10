'use strict';

const express = require('express');
const sortJsonArray = require('sort-json-array');
const router = express.Router();

const googleMapsProvider = require('../providers/googleMapsProvider.js');
const geo_helper = require('../geo-helper.js');

/* GET users listing. */
router.get('/', function(req, res, next) {

    let destinationJson = {
        destination : req.query.destination || '6.850740,79.873541'
    };

    let destinationSplit = destinationJson.destination.split(',');

    geo_helper.getNearByVehicles(destinationSplit[0], destinationSplit[1]).then(function (geoHelperResponse) {

        let groups = [], i, previousIndex = 0, range = 500;

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
