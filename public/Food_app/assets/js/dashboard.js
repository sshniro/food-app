$(document).ready(function() {

    functions.onStartInit($('#orderIdSelect').val());

    $('#orderIdSelect').change(function() {
        functions.onStartInit($('#orderIdSelect').val());

        if (markersArray) {
            for (i in markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray.length = 0;
        }
    });

    setInterval(function(){
        functions.onStartInit($('#orderIdSelect').val());
    }, 5000);

    functions.mapInit();

});


let functions = {
    onStartInit: function(id) {

        console.log('onStartInit Method Called')

        let settings = {
            'async': true,
            'crossDomain': true,
            'url': 'http://127.0.0.1:3000/orders?orderId=' + id,
            'method': 'GET',
            'headers': {
                'cache-control': 'no-cache'
            }
        };

        $.ajax(settings).done(function (response) {

            $('#orderId').html(response.orderId);
            $('#orderStatus').html(response.orderStatus);
            $('#orderOrigin').html(response.origin);
            $('#orderDestination').html(response.destination);
            $('#orderTimestamp').html(Date(response.timestamp));

            functions.populateTableRow(response);

        });
    }, populateTableRow: function(populatingData) {

        console.log('populateTableRow Method Called');

        $('#oderListTableBody').html('');

        let i;
        for (i = 0; i < populatingData.notifiedDrivers.length; i += 1) {
            if(populatingData.orderStatus === 'REQUEST_PENDING'){

                $('#oderListTableBody').append('' +
                    '<tr >\n' +
                    '    <td>' + (i + 1) + '</td>\n' +
                    '    <td>' + populatingData.notifiedDrivers[i].key + '</td>\n' +
                    '    <td>' + populatingData.notifiedDrivers[i].distance + '</td>\n' +
                    '    <td>' + populatingData.notifiedDrivers[i].rating + '</td>\n' +
                    '    <td>' +
                    '        <button type="submit" class="btn btn-primary pull-right" onclick="functions.acceptOrder(\''+ populatingData.orderId + '\', \'' + populatingData.notifiedDrivers[i].key + '\');">Accept Order</button>' +
                    '    </td>\n' +
                    '</tr>');

            }else {

                if(populatingData.notifiedDrivers[i].key === populatingData.orderAccepter){
                    $('#oderListTableBody').append('' +
                        '<tr >\n' +
                        '    <td>' + (i + 1) + '</td>\n' +
                        '    <td>' + populatingData.notifiedDrivers[i].key + '</td>\n' +
                        '    <td>' + populatingData.notifiedDrivers[i].distance + '</td>\n' +
                        '    <td>$56.00</td>\n' +
                        '    <td class="text-primary">Fair Accepted</td>\n' +
                        '</tr>');
                }else {
                    $('#oderListTableBody').append('' +
                        '<tr >\n' +
                        '    <td>' + (i + 1) + '</td>\n' +
                        '    <td>' + populatingData.notifiedDrivers[i].key + '</td>\n' +
                        '    <td>' + populatingData.notifiedDrivers[i].distance + '</td>\n' +
                        '    <td>$56.00</td>\n' +
                        '    <td class="text-primary">Not Responded</td>\n' +
                        '</tr>');
                }
            }

            let marker = new google.maps.Marker({
                map: map,
                draggable: false,
                icon: 'file:///Users/nikethanselvanathan/Node/food-app/public/Food_app/assets/img/car.png',
                position: new google.maps.LatLng(populatingData.notifiedDrivers[i].latitude, populatingData.notifiedDrivers[i].longitude)
            });

            markersArray.push(marker);
        }

    }, acceptOrder: function (orderId, driverId) {

        let jsonData = {
            orderId: orderId,
            driverId: driverId
        };

        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "http://127.0.0.1:3000/orders",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
                "cache-control": "no-cache"
            },
            "processData": false,
            "data": JSON.stringify(jsonData)
        }

        $.ajax(settings).done(function (response) {

            $('#orderId').html(response.orderId);
            $('#orderStatus').html(response.orderStatus);
            $('#orderOrigin').html(response.origin);
            $('#orderDestination').html(response.destination);
            $('#orderTimestamp').html(Date(response.timestamp));

            functions.populateTableRow(response);

        });

    }, mapInit : function initialize() {
         let mapDiv = document.getElementById('map-canvas');
         map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(6.84, 79.89),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
         });

    }

};

let map, markersArray = [];