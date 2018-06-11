$(document).ready(function() {

    functions.mapInit();

});


let functions = {

    mapInit : function initialize() {
        let mapDiv = document.getElementById('map-canvas');
        let map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(6.84, 79.89),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        let markerobject = new google.maps.Marker({
            map: map,
            draggable: true,
            position: new google.maps.LatLng(6.84, 79.89)

        });

        google.maps.event.addListener(markerobject, 'dragend', function(args){
            $('#latitude').html('Lat, & Lng: ' + args.latLng.lat() + ',' + args.latLng.lng());
        });

        google.maps.event.addListener(markerobject, 'drag', function(args){
            $('#latitude').html('Lat, & Lng: ' + args.latLng.lat() + ',' + args.latLng.lng());
        });

        google.maps.event.addDomListener(window, 'load', initialize);
        
    }, orderSubmit: function () {

        let orderJson = {
            orderId: $('#orderId').val(),
            foodStoreLatitudeAndLongitude: $('#foodStoreLatitudeAndLongitude').val(),
            UserAddressLatitudeAndLongitude: $('#UserAddressLatitudeAndLongitude').val()
        };

        $('#orderId').val(''); $('#foodStoreLatitudeAndLongitude').val(''); $('#UserAddressLatitudeAndLongitude').val('');

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': 'http://localhost:3000/drivers?orderId=' + orderJson.orderId + '&origin=' + orderJson.foodStoreLatitudeAndLongitude + '&destination=' + orderJson.UserAddressLatitudeAndLongitude,
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