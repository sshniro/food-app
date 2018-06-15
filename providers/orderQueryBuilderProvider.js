'use strict';

const postgreSQLService = require('../services/postgreSQLService.js');

module.exports = {
    getOrders: getOrders,
    getCompleteOrder: getCompleteOrder,
    acceptOrder: acceptOrder,
    insertOrder: insertOrder,
    insertNotifiedDriver: insertNotifiedDriver
};

function getOrders(orderId) {

    return new Promise(function (resolve, reject) {

        let query;

        if(orderId === ''){
            query = 'SELECT * FROM orders ORDER BY id ASC;';
        }else{
            query = 'SELECT * FROM orders WHERE id = \'' + orderId + '\';';
        }

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
            if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows});
            else return reject({success: false, message: 'Failed to insert order'});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function getCompleteOrder(orderId) {

    return new Promise(function (resolve, reject) {

        let query = 'SELECT * FROM orders WHERE id = \'' + orderId + '\';';

        postgreSQLService.queryExecutor(query).then(function (getCompleteOrderQueryResponse) {

            if(getCompleteOrderQueryResponse.rowCount > 0){

                getNotifiedDriver(orderId).then(function (getNotifiedDriverQueryResponse) {
                    getCompleteOrderQueryResponse.rows[0].notifiedDrivers = getNotifiedDriverQueryResponse.data;
                    return resolve({success: true, data: getCompleteOrderQueryResponse.rows[0]});
                }).catch(function (err) {
                    console.log(err);
                    return reject({success: false, message: err});
                });

            }
            else return reject({success: false, message: 'Failed to retrieve order'});

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}


function insertOrder(orderJson) {

    return new Promise(function (resolve, reject) {

        let query = 'INSERT INTO orders(origin, destination, origin_address, destination_address, distance, duration, order_status, timestamp) values(';

        query = query.concat('\'' + orderJson.origin + '\', \'' + orderJson.destination + '\', \'' + orderJson.origin_address + '\', \'' + orderJson.destination_address + '\', ' + orderJson.distance.value + ', ' + orderJson.duration.value + ', \'' + orderJson.orderStatus + '\', ' + orderJson.timestamp);

        query = query.concat(') RETURNING id;');

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
            if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows[0]});
            else return reject({success: false, message: 'Failed to insert order'});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function insertNotifiedDriver(orderId, notifiedDriver) {

    return new Promise(function (resolve, reject) {

        let query = 'INSERT INTO notified_drivers(orderId, driverId) values(';

        query = query.concat(orderId + ', ' + notifiedDriver.id);

        query = query.concat(') RETURNING orderId, driverId;');

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
            if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows[0]});
            else return reject({success: false, message: 'Failed to insert order'});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function getNotifiedDriver(orderId) {

    return new Promise(function (resolve, reject) {

        // let query = 'SELECT * FROM notified_drivers WHERE orderId = ' + orderId + ';';

        let query = 'SELECT * FROM notified_drivers INNER JOIN drivers ON notified_drivers.driverId = drivers.id WHERE notified_drivers.orderId = \'' + orderId + '\';';

        postgreSQLService.queryExecutor(query).then(function (queryResponse) {
            if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows});
            else return reject({success: false, message: 'Failed to insert order'});
        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}

function acceptOrder(oderJson) {

    return new Promise(function (resolve, reject) {

        let query = 'UPDATE orders SET order_acceptor = ' + oderJson.driverId + ', order_status = \'REQUEST_ACCEPTED\' WHERE id = ' + oderJson.orderId + ' RETURNING id, order_acceptor;';

        getOrders(oderJson.orderId).then(function (queryResponse) {

            if(queryResponse.data[0].order_status === 'REQUEST_PENDING'){

                postgreSQLService.queryExecutor(query).then(function (queryResponse) {
                    console.log(queryResponse)
                    if(queryResponse.rowCount > 0) return resolve({success: true, data: queryResponse.rows[0]});
                    else return reject({success: false, message: 'Failed to update order'});
                }).catch(function (err) {
                    console.log(err);
                    return reject({success: false, message: err});
                });

            }else{
                return reject({success: false, message: 'Order already accepted by another driver'});
            }

        }).catch(function (err) {
            console.log(err);
            return reject({success: false, message: err});
        });

    });
}