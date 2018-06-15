'use strict';

const express = require('express');
const router = express.Router();

const authenticationProvider = require('../providers/authenticationProvider.js');
const orderQueryBuilderProvider = require('../providers/orderQueryBuilderProvider.js');
const geo_helper = require('../geo-helper.js');


/* GET All orders */
router.get('/v2', function(req, res, next){

    console.log('came')

    let orderId = req.query.orderId || '';

    orderQueryBuilderProvider.getOrders(orderId).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

/* GET Complete orders (Joined) */
router.get('/complete/v2', function(req, res, next){

    let orderId = req.query.orderId;

    if(!orderId){
        return res.status(500).json({success: false, message: 'Need orderId to continue'});
    }

    orderQueryBuilderProvider.getCompleteOrder(orderId).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });

});

/* GET Accept a order */
router.post('/accept/v2', authenticationProvider.permit('driver'), function(req, res, next){

    let oderJson = {
        orderId: req.body.orderId || 1,
        driverId: req.user.id
    };

    orderQueryBuilderProvider.acceptOrder(oderJson).then(function (response) {
        return res.status(200).json(response);
    }).catch(function (err) {
        return res.status(500).json(err);
    });
});


/* Old */
router.get('/', function(req, res, next) {

    let orderJson = {
        orderId : req.query.orderId || 'testId1'
    };

    geo_helper.getFromRedis(orderJson.orderId).then(function (getFromRedisResponse) {
        res.status(200).json(JSON.parse(getFromRedisResponse));
    });

});

router.post('/', function(req, res, next) {

    let oderJson = {
        orderId: req.body.orderId || 'testId2',
        driverId: req.body.driverId || 'driver09-bekariya-junction'
    };

    geo_helper.getFromRedis(oderJson.orderId).then(function (getFromRedisResponse) {
        let redisOrderInfo = JSON.parse(getFromRedisResponse);

        if(redisOrderInfo.orderStatus === 'REQUEST_PENDING'){

            let i;
            for (i = 0; i < redisOrderInfo.notifiedDrivers.length; i += 1) {
                if(redisOrderInfo.notifiedDrivers[i].key === oderJson.driverId){
                    redisOrderInfo.orderStatus = 'REQUEST_ACCEPTED'
                    redisOrderInfo.orderAccepter = oderJson.driverId
                }
            }
            geo_helper.persistInRedis(oderJson.orderId, JSON.stringify(redisOrderInfo));
        }

        res.status(200).json(redisOrderInfo);

    });
});

module.exports = router;
