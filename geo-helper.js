const redis = require("redis"),
    client = redis.createClient();

const geo = require('georedis').initialize(client);

client.on("error", function (err) {
    console.log("Error " + err);
});

function getCoordinatesOfADriver(driverId) {
    geo.location(driverId, function (err, location) {
        if (err) console.error(err)
        else console.log('Location for Toronto is: ', location.latitude, location.longitude)
    });
}

function getCoordinatesOfMultipleDrivers() {
    geo.locations(['Toronto', 'Philadelphia', 'Palo Alto', 'San Francisco', 'Ottawa'], function (err, locations) {
        if (err) console.error(err)
        else {
            for (var locationName in locations) {
                console.log(locationName + "'s location is:", locations[locationName].latitude, locations[locationName].longitude)
            }
        }
    });
}

function defaultSearchForNearByVehicles() {
    // look for all points within ~5000m of Toronto.
    geo.nearby({latitude: 43.646838, longitude: -79.403723}, 5000, function(err, locations){
        if(err) console.error(err)
        else console.log('nearby locations:', locations)
    })
}

function getNearByVehicles(lat, long) {

    return new Promise(function(resolve, reject) {
        let options = {
            withCoordinates: true, // Will provide coordinates with locations, default false
            withHashes: true, // Will provide a 52bit Geohash Integer, default false
            withDistances: true, // Will provide distance from query, default false
            order: 'ASC', // or 'DESC' or true (same as 'ASC'), default false
            units: 'm', // or 'km', 'mi', 'ft', default 'm'
            count: 100, // Number of results to return, default undefined
            accurate: true // Useful if in emulated mode and accuracy is important, default false
        };

        // look for all points within ~5000m of Toronto with the options.
        geo.nearby({latitude: lat, longitude: long}, 5000, options, function (err, locations) {
            if (err) {
                console.error(err)
                reject();
            }
            // else console.log('nearby locations:', locations)

            resolve(locations);
        });
    });
}

// Do async job
let locationSet = {
    'driver01-malwatta-rd': {latitude: 6.853915, longitude: 79.868029, rating: 4.5},
    'driver02-hill-street': {latitude: 6.850999, longitude: 79.867979, rating: 3.2},
    'driver03-dehiwala-station': {latitude: 6.850740, longitude: 79.862529, rating: 4.1},
    'driver04-dharmarama-rd': {latitude: 6.849377, longitude: 79.873545, rating: 3.7},
    'driver05-galvahara-rd': {latitude: 6.850304, longitude: 79.875723, rating: 2.6},
    'driver06-b11-rd': {latitude: 6.851155, longitude: 79.872016, rating: 1.9},
    'driver07-station-rd': {latitude: 6.827976, longitude: 79.869536, rating: 1.3},
    'driver08-maliban': {latitude: 6.816769, longitude: 79.878820, rating: 0.4},
    'driver09-bekariya-junction': {latitude: 6.826914, longitude: 79.884904, rating: 4.6},
    'driver10-saranankara-rd': {latitude: 6.856924, longitude: 79.878723, rating: 3.2},
    'driver11-wasilva-mawatha': {latitude: 6.873073, longitude: 79.864404, rating: 4.1},
    'driver12-visakha': {latitude: 6.866655, longitude: 79.884382, rating: 3.6},
    'driver13-narahenpita': {latitude: 6.906790, longitude: 79.869705, rating: 2.6},
    'driver14-cotta-rd': {latitude: 6.902645, longitude: 79.862495, rating: 4.1}
};


function initDriverLatLongData() {

    return new Promise(function(resolve, reject) {

        geo.addLocations(locationSet, function (err, reply) {
            if (err) {
                console.error(err)
                reject();
            }
            else console.log('added locations:', reply)

            resolve({'dataInserted': reply});

        });
    })
}


module.exports = {
    initDriverLatLongData : initDriverLatLongData,
    getNearByVehicles : getNearByVehicles,
    locationSet : locationSet
};