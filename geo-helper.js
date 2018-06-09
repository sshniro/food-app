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
        if (err) console.error(err);
        else console.log('nearby locations:', locations)
    });
}


function initDriverLatLongData() {

    return new Promise(function(resolve, reject) {
        // Do async job
        let locationSet = {
            'driver1-malwatta-rd': {latitude: 6.853915, longitude: 79.868029},
            'driver2-hill-street': {latitude: 6.850999, longitude: 79.867979},
            'driver3-dehiwala-station': {latitude: 6.850740, longitude: 79.862529},
            'driver4-dharmarama-rd': {latitude: 6.849377, longitude: 79.873545},
            'driver5-galvahara-rd': {latitude: 6.850304, longitude: 79.875723},
            'driver6-b11-rd': {latitude: 6.851155, longitude: 79.872016}
        };

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


initDriverLatLongData().then(function () {
    getNearByVehicles(6.850740, 79.873541);
});