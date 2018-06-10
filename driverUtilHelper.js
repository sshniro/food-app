const geo_helper = require('geo-helper');
const configs = require('config/baseConfig');

function getDriverGroupedByDistanceAndSortByRating(latLong) {
    let destinationJson = {
        destination : latLong || '6.850740,79.873541'
    };

    let destinationSplit = destinationJson.destination.split(',');

    return new Promise(function (resolve, reject) {
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

            resolve({row : groups});
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });

}
