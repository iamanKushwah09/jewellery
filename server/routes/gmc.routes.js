/**
 * GMC Routes — Full GMC Management API
 */

const express = require('express');
const router = express.Router();
const gmcController = require('../controller/gmc.controller');

// Batch sync all products
router.post('/sync', gmcController.triggerBatchSync);

// Status overview & queue metrics
router.get('/status', gmcController.getGmcStatus);

// Audit logs
router.get('/logs', gmcController.getGmcLogs);

// Single product sync & retry
router.post('/product/:id/retry', gmcController.retryProductSync);
router.post('/product/:id', gmcController.syncSingleProduct);
router.delete('/product/:id', gmcController.deleteSingleProduct);

module.exports = router;
