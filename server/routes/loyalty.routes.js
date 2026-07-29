const express = require('express');
const router = express.Router();
const loyaltyController = require('../controller/loyalty.controller');

// Admin route to get all users loyalty points
router.get('/all', loyaltyController.getAllLoyaltyPoints);

// Admin route to manually adjust points
router.post('/adjust', loyaltyController.adjustLoyaltyPoints);

// Customer route to get their own points
router.get('/customer/:customerId', loyaltyController.getCustomerLoyaltyPoints);

module.exports = router;
