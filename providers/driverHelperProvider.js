'use strict';

const sortJsonArray = require('sort-json-array');

const geo_helper = require('../geo-helper.js');
const configs = require('../config/baseConfig');
const mapsUtilHelper = require('../mapsUtilHelper.js');
const driverQueryBuilderProvider = require('../providers/driverQueryBuilderProvider.js');
const orderQueryBuilderProvider = require('../providers/orderQueryBuilderProvider.js');

module.exports = {
    findAvailableDrivers: findAvailableDrivers
};

function findAvailableDrivers(destinationJson, notify){

    return new Promise(function (resolve, reject) {

        mapsUtilHelper.calculateDistanceMatrixFromOriginsToDestinations(destinationJson).then(function (mapsUtilHelperResponse) {
            let result = {}, key;
            for(key in destinationJson) result[key] = destinationJson[key];
            for(key in mapsUtilHelperResponse) result[key] = mapsUtilHelperResponse[key];

            getDriverGroupedByDistance(result).then(function (driverUtilHelperResponse) {
                let response = {
                    success: true,
                    data: driverUtilHelperResponse.row
                };

                if(notify){
                    sortAvailableDriversByRating(driverUtilHelperResponse.row, driverUtilHelperResponse.destinationJson);
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

function getDriverGroupedByDistance(destinationJson) {

    let destinationSplit = destinationJson.origin.split(',');

    return new Promise(function (resolve, reject) {
        geo_helper.getNearByVehicles(destinationSplit[0], destinationSplit[1]).then(function (geoHelperResponse) {

            let groups = [], i, previousIndex = 0, range = configs.driverGroupSegByDistanceVal;

            for (i = 0; i < geoHelperResponse.length; i += 1) {

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

function sortAvailableDriversByRating(sortedDriversByDistance, destinationJson) {
    let i, j, k, driverArr = [];

    for(i = 0; i < sortedDriversByDistance.length; i += 1){
        for(j = 0; j < sortedDriversByDistance[i].length; j += 1){
            driverArr.push(sortedDriversByDistance[i][j].key);
        }
    }

    driverQueryBuilderProvider.getDriversBYIDs(driverArr).then(function(response) {

        for(i = 0; i < sortedDriversByDistance.length; i += 1){
            for(j = 0; j < sortedDriversByDistance[i].length; j += 1){

                for(k = 0; k < response.data.length; k += 1){
                    if(sortedDriversByDistance[i][j].key === response.data[k].username){
                        sortedDriversByDistance[i][j].id = response.data[k].id;
                        sortedDriversByDistance[i][j].driver_rating = response.data[k].driver_rating;
                    }
                }
            }
        }

        for (i = 0; i < sortedDriversByDistance.length; i += 1) {
            sortedDriversByDistance[i] = sortJsonArray(sortedDriversByDistance[i], 'driver_rating', 'des');
        }

        notifyDrivers(sortedDriversByDistance, destinationJson);

    }).catch(function (err) {
        console.log(err);
    });

}

function notifyDrivers(sortedDriversByDistance, destinationJson) {

    let driverGroups = sortedDriversByDistance, persistJson = {};

    for(let key in destinationJson) persistJson[key] = destinationJson[key];

    persistJson['orderStatus'] = 'REQUEST_PENDING';
    persistJson['timestamp'] = Date.now();
    persistJson['notifiedDrivers'] = [];

    orderQueryBuilderProvider.insertOrder(persistJson).then(function (response) {

        for(let key in response.data) persistJson[key] = response.data[key];

        if(driverGroups.length > 0 && driverGroups[0].length > 0) {

            orderQueryBuilderProvider.insertNotifiedDriver(persistJson.id, driverGroups[0][0]).then(function (response) {

                if(driverGroups[0].length > 1){
                    driverGroups[0].splice(0, 1);
                }else {
                    driverGroups.splice(0, 1);
                }

                if(driverGroups.length > 0){ notifyDriversByDistance(driverGroups, persistJson.id) }

            }).catch(function (err) {
                console.log(err);
            });

        }

    }).catch(function (err) {
        console.log(err);
    });

}

function notifyDriversByDistance(driverGroups, orderId) {

    setTimeout(function(){

        orderQueryBuilderProvider.getOrders(orderId).then(function (response) {

            if(response.data.length > 0 && response.data[0].order_status === 'REQUEST_PENDING'){
                let i, j, promiseArr = [];

                for (i = 0; i < 1; i += 1) {

                    for (j = 0; j < driverGroups[i].length; j += 1) {
                        promiseArr.push(orderQueryBuilderProvider.insertNotifiedDriver(orderId, driverGroups[i][j]));
                    }
                    driverGroups.splice(i, 1);

                    Promise.all(promiseArr).then(function(response) {
                        if(driverGroups.length > 0){ notifyDriversByDistance(driverGroups, orderId) }
                    }).catch(function (err) {
                        console.log(err);
                    });

                }
            }else{
                console.log('Oder Not Found');
            }

        }).catch(function (err) {
            console.log(err);
        });

    }, 10 * 1000);
}