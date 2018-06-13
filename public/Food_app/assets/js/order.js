$(document).ready(function() {
    functions.getAPIkey();
});


let functions = {

    getAPIkey: function () {

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': window.location.origin + '/apiKey',
            'method': 'GET',
            'headers': {
                'cache-control': 'no-cache'
            }
        };

        $.ajax(settings).done(function (response) {

            let loadScriptSettings = {
                'async': true,
                'crossDomain': true,
                'dataType': 'script',
                'url': 'https://maps.googleapis.com/maps/api/js?sensor=false&key=' + response.key
            };

            $.ajax(loadScriptSettings).done(function () {
                functions.mapInit();

                functions.initFrom($('#orderId').val());

                $('#orderId').change(function() {
                    functions.initFrom($('#orderId').val());
                });
            });
        });


    }, mapInit : function initialize() {
        let mapDiv = document.getElementById('map-canvas');

        map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(6.84, 79.89),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        
    }, clearMarkers: function(){
        if (markersArray) {
            for (let i in markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray.length = 0;
        }
    }, getUserCurrentAddress: function(){

        let infoWindow = new google.maps.InfoWindow({map: map});

        if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(function(position) {

                let pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(pos);

                functions.calculateDistance($('#foodStoreLatitudeAndLongitude').attr('dataFoodStoreLatitudeAndLongitude'), pos.lat + ',' + pos.lng);
                functions.addMarker('User', pos.lat, pos.lng);

            }, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geo location
            handleLocationError(false, infoWindow, map.getCenter());
        }

        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: Your browser doesn\'t support geolocation.');
        }

    }, addMarker: function(type, latitude, longitude){

        let markerobject = new google.maps.Marker({
            map: map,
            draggable: true,
            position: new google.maps.LatLng(latitude, longitude)
        });

        markersArray.push(markerobject);

        if(type === 'Restaurant'){

            google.maps.event.addListener(markerobject, 'dragend', function(args){
                functions.calculateDistance(args.latLng.lat() + ',' + args.latLng.lng(), $('#UserAddressLatitudeAndLongitude').attr('dataUserAddressLatitudeAndLongitude'));
            });

        }else{

            google.maps.event.addListener(markerobject, 'dragend', function(args){
                functions.calculateDistance($('#foodStoreLatitudeAndLongitude').attr('dataFoodStoreLatitudeAndLongitude'), args.latLng.lat() + ',' + args.latLng.lng())
            });

        }

    }, calculateDistance: function(foodStoreLatitudeAndLongitude, userAddressLatitudeAndLongitude){

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': window.location.origin + '/maps/distancematrix/?origins=' + foodStoreLatitudeAndLongitude + '&destinations=' + userAddressLatitudeAndLongitude,
            'method': 'GET',
            'headers': {
                'cache-control': 'no-cache'
            }
        };

        $.ajax(settings).done(function (response) {

            if(response.length > 0){
                response[0].destination = userAddressLatitudeAndLongitude;
                response[0].origin = foodStoreLatitudeAndLongitude;
                functions.setInputValuse(response[0]);
            }
        });

    }, initFrom: function(dropDownVal){

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': window.location.origin + '/orders?orderId=' + dropDownVal,
            'method': 'GET',
            'headers': {
                'cache-control': 'no-cache'
            }
        };

        $.ajax(settings).done(function (response) {

            functions.clearMarkers();

            functions.setInputValuse(response);
            let originSplit = response.origin.split(',');

            functions.addMarker('Restaurant', originSplit[0], originSplit[1]);
            functions.getUserCurrentAddress();

        });

    }, setInputValuse: function(response){

        $('#UserAddressLatitudeAndLongitude').attr('dataUserAddressLatitudeAndLongitude', response.destination);
        $('#UserAddressLatitudeAndLongitude').val(response.destination_address);

        $('#foodStoreLatitudeAndLongitude').attr('dataFoodStoreLatitudeAndLongitude', response.origin);
        $('#foodStoreLatitudeAndLongitude').val(response.origin_address);

        $('#distance').val(response.distance.text);
        $('#basePrice').val(Math.round((response.distance.value / 1000) * 40).toFixed(2) + '/=');
        $('#duration').val(response.duration.text);

    }, orderSubmit: function () {

        let orderJson = {
            orderId: $('#orderId').val(),
            foodStoreLatitudeAndLongitude: $('#foodStoreLatitudeAndLongitude').attr('dataFoodStoreLatitudeAndLongitude'),
            UserAddressLatitudeAndLongitude: $('#UserAddressLatitudeAndLongitude').attr('dataUserAddressLatitudeAndLongitude')
        };

        $('#orderId').val(''); $('#foodStoreLatitudeAndLongitude').val(''); $('#UserAddressLatitudeAndLongitude').val('');
        $('#distance').val(''); $('#basePrice').val(''); $('#duration').val('');

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': window.location.origin + '/drivers?orderId=' + orderJson.orderId + '&origin=' + orderJson.foodStoreLatitudeAndLongitude + '&destination=' + orderJson.UserAddressLatitudeAndLongitude,
            'method': 'GET',
            'headers': {
                'cache-control': 'no-cache'
            }
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        });

    }

};


let map, markersArray = [];