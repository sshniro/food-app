'use strict';


let express = require('express');
let request = require('request');

module.exports = {
	calculateDistance: calculateDistance
};

function calculateDistance(originLatitude, originLongitude, destinationLatitude, destinationLongitude){

	var options = { 
		method: 'GET',
		url: 'https://maps.googleapis.com/maps/api/distancematrix/json',
		qs: { 
			units: 'imperial',
			origins: originLatitude + ',' + originLongitude,
			destinations: destinationLatitude + ',' + destinationLongitude
		},
		headers: { 
			'cache-control': 'no-cache' 
		} 
	};

	return new Promise(function (resolve, reject) {

		request(options, function (error, response, body) {
			if (error) return reject(error);

            if (body.status != 'INVALID_REQUEST') {
                return resolve(body);
            }else{
                return reject(error);
            }
        });

	});
}