'use strict';

const googleMapsProvider = require('./providers/googleMapsProvider.js');

module.exports = {
    sortDistanceMatrixFromOriginsToDestinations: sortDistanceMatrixFromOriginsToDestinations
};

function sortDistanceMatrixFromOriginsToDestinations(driversToDestination) {

    return new Promise(function (resolve, reject) {
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

            // resolve(googleMapsProviderResponse);
            resolve(groups);
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });

}



