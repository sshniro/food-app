$(document).ready(function() {
    functions.getAPIkey();

    $('#orderId').change(function() {

        let foodStoreLatitudeAndLongitude, UserAddressLatitudeAndLongitude, dropDown = $('#orderId').val() ;
        
        if(dropDown === 'testId1'){
            foodStoreLatitudeAndLongitude = '6.841363514814405,79.88948501586913';
            UserAddressLatitudeAndLongitude = '6.852612363417815,79.86819900512694';
        }else if(dropDown === 'testId2'){
            foodStoreLatitudeAndLongitude = '6.876131825121326,79.87935699462889';
            UserAddressLatitudeAndLongitude = '6.845635261345678,79.84578924571345';
        }else if(dropDown === 'testId3'){
            foodStoreLatitudeAndLongitude = '6.809319889107459,79.88725341796874';
            UserAddressLatitudeAndLongitude = '6.874321345678912,79.88392604739203';
        }

        $('#foodStoreLatitudeAndLongitude').val(foodStoreLatitudeAndLongitude);
        $('#UserAddressLatitudeAndLongitude').val(UserAddressLatitudeAndLongitude);

    });
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
            });
        });




    }, mapInit : function initialize() {
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