'use strict';

const sortJsonArray = require('sort-json-array');

const geo_helper = require('./geo-helper');
const configs = require('./config/baseConfig');
const mapsUtilHelper = require('./mapsUtilHelper.js');

module.exports = {
    findAvailableDrivers: findAvailableDrivers,
    getDriverGroupedByDistanceAndSortByRating: getDriverGroupedByDistanceAndSortByRating
};

function findAvailableDrivers(destinationJson, notify){

    return new Promise(function (resolve, reject) {

        mapsUtilHelper.calculateDistanceMatrixFromOriginsToDestinations(destinationJson).then(function (mapsUtilHelperResponse) {
            let result = {}, key;
            for(key in destinationJson) result[key] = destinationJson[key];
            for(key in mapsUtilHelperResponse) result[key] = mapsUtilHelperResponse[key];

            getDriverGroupedByDistanceAndSortByRating(result).then(function (driverUtilHelperResponse) {
                let response = {
                    success: true,
                    data: driverUtilHelperResponse.row
                };

                if(notify){
                    notifyDrivers(driverUtilHelperResponse.row, driverUtilHelperResponse.destinationJson);
                    resolve({status : 'Successfully notified the drivers.'});
                }else {
                    resolve(response);
                }

            }).catch(function (err) {
                console.log(err);
                reject(err);
            });

        }).catch(function (err) {
            console.log(err);
            reject(err);
        });

    });
}

function getDriverGroupedByDistanceAndSortByRating(destinationJson) {

    let destinationSplit = destinationJson.origin.split(',');

    return new Promise(function (resolve, reject) {
        geo_helper.getNearByVehicles(destinationSplit[0], destinationSplit[1]).then(function (geoHelperResponse) {

            let groups = [], i, previousIndex = 0, range = configs.driverGroupSegByDistanceVal;

            for (i = 0; i < geoHelperResponse.length; i += 1) {

                geoHelperResponse[i].rating = geo_helper.locationSet[geoHelperResponse[i].key].rating;

                if(geoHelperResponse[i].distance > range){

                    if((geoHelperResponse[i].distance - range) < configs.driverGroupSegByDistanceVal && i > 0){
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

            resolve({
                row : groups,
                destinationJson: destinationJson
            });

        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });

}

function notifyDrivers(sortedDriversByDistance, destinationJson) {

    let driverGroups = sortedDriversByDistance;

    let persistJson = {
        orderStatus: 'REQUEST_PENDING',
        timestamp: Date.now(),
        notifiedDrivers: []
    };

    for(let key in destinationJson) persistJson[key] = destinationJson[key];

    if(driverGroups.length > 0 && driverGroups[0].length > 0) {
        persistJson.notifiedDrivers.push(driverGroups[0][0]);

        if(driverGroups[0].length > 1){
            driverGroups[0].splice(0, 1);
        }else {
            driverGroups.splice(0, 1);
        }

        geo_helper.persistInRedis(destinationJson.orderId, JSON.stringify(persistJson));

        if(driverGroups.length > 0){ notifyDriversByDistance(driverGroups, destinationJson.orderId) }
    }

}

function notifyDriversByDistance(driverGroups, orderId) {

    setTimeout(function(){

        geo_helper.getFromRedis(orderId).then(function (getFromRedisResponse) {
            let redisOrderInfo = JSON.parse(getFromRedisResponse);

            if(redisOrderInfo.orderStatus === 'REQUEST_PENDING'){

                let i, j;
                for (i = 0; i < 1; i += 1) {

                    for (j = 0; j < driverGroups[i].length; j += 1) {
                        redisOrderInfo.notifiedDrivers.push(driverGroups[i][j]);
                    }
                    driverGroups.splice(i, 1);

                }
                geo_helper.persistInRedis(orderId, JSON.stringify(redisOrderInfo));

                if(driverGroups.length > 0){ notifyDriversByDistance(driverGroups, orderId) }

            }

        });

    }, 10 * 1000);
}
