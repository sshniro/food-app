
function getCoordiantesOfADriver() {
    geo.location('Toronto', function (err, location) {
        if (err) console.error(err)
        else console.log('Location for Toronto is: ', location.latitude, location.longitude)
    });
}

function getCoordiantesOfMultipleDrivers() {
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

function getNearByVehicles() {
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
    geo.nearby({latitude: 43.646838, longitude: -79.403723}, 5000, options, function (err, locations) {
        if (err) console.error(err);
        else console.log('nearby locations:', locations)
    });
}
