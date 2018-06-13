const redis = require("redis"),
    client = redis.createClient();

const geo = require('georedis').initialize(client);

const locationSet = {
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

let destinationJsonSet = [{
    orderId : 'testId1',
    origin: '6.863543,79.904504',
    destination: '6.839555, 79.892316'
}, {
    orderId : 'testId2',
    origin: '6.831878,79.883132',
    destination: '6.832134, 79.894419'
}, {
    orderId : 'testId3',
    origin: '6.809319889107459,79.88748945236205',
    destination: '6.911700782159839,79.8564837623046'
} ];

client.on("error", function (err) {
    console.log("Error " + err);
});

const getCoordinatesOfADriver = (driverId) => {
    geo.location(driverId, function (err, location) {
        if (err) console.error(err)
        else console.log('Location for Toronto is: ', location.latitude, location.longitude)
    });
};

const getCoordinatesOfMultipleDrivers = (driverIdArray) => {
    geo.locations(driverIdArray, function (err, locations) {
        if (err) console.error(err)
        else {
            for (let locationName in locations) {
                console.log(locationName + "'s location is:", locations[locationName].latitude, locations[locationName].longitude)
            }
        }
    });
};

const defaultSearchForNearByVehicles = (lat, long, distanceInMeter) => {
    geo.nearby({latitude: lat, longitude: long}, distance, function (err, locations) {
        if (err) console.error(err);
        else console.log('nearby locations:', locations)
    })
};

const persistInRedis = (key, value) => {
    client.set(key, value, redis.print);
};

const getFromRedis = (key) => {
    return new Promise(function (resolve, reject) {
        client.get(key, function(err, reply) {
            // reply is null when the key is missing
            // console.log(reply);
            resolve(reply);
        });
    });
};

function getNearByVehicles(lat, long) {

    return new Promise(function (resolve, reject) {
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
                console.error(err);
                reject();
            }
            // else console.log('nearby locations:', locations)
            resolve(locations);
        });
    });
}


function addLocationsToRedis(locations) {
    return new Promise(function (resolve, reject) {
        geo.addLocations(locations, function (err, reply) {
            if (err) {
                console.error(err);
                reject();
            }
            else console.log('added locations:', reply);
            resolve({'dataInserted': reply});
        });
    });
}

function addLocationToRedis(location) {
    return new Promise(function (resolve, reject) {
        geo.addLocation(location.key, location.body, function (err, reply) {
            if (err) {
                console.error(err);
                reject();
            }
            else console.log('added location:', reply);
            resolve({'dataInserted': reply});
        });
    });
}

function removeLocationsFromRedis(locationsArray) {
    return new Promise(function (resolve, reject) {
        geo.removeLocations(locationsArray, function (err, reply) {
            if (err) {
                console.error(err);
                reject();
            }
            else console.log('removed locations:', reply);
            resolve({'dataRemoved': reply});
        });
    });
}

function removeLocationFromRedis(location) {
    return new Promise(function (resolve, reject) {
        geo.removeLocation(location, function (err, reply) {
            if (err) {
                console.error(err);
                reject();
            }
            else console.log('removed location:', reply);
            resolve({'dataRemoved': reply});
        });
    });
}

module.exports = {
    addLocationsToRedis: addLocationsToRedis,
    addLocationToRedis: addLocationToRedis,
    removeLocationsFromRedis: removeLocationsFromRedis,
    removeLocationFromRedis: removeLocationFromRedis,
    getNearByVehicles: getNearByVehicles,
    persistInRedis: persistInRedis,
    getFromRedis: getFromRedis,
    locationSet: locationSet,
    destinationJsonSet: destinationJsonSet
};