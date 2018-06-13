'use strict';

const express = require('express');
const router = express.Router();

const geo_helper = require('../geo-helper.js');

/* GET driver listing from destination */
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
