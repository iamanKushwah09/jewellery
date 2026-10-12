const express = require("express");
const router = express.Router();
const amazonController = require("../controller/amazon.controller");

// Public webhook endpoint for Amazon SNS Notifications
router.post("/webhook", amazonController.handleWebhook);

// Protected Admin endpoints
router.get("/settings", amazonController.getAmazonSettings);
router.put("/settings", amazonController.updateAmazonSettings);
router.post("/test-connection", amazonController.testConnection);
router.post("/sync-orders", amazonController.triggerOrderSync);
router.post("/sync-inventory", amazonController.triggerInventoryPush);
router.post("/simulate-order", amazonController.simulateOrder);
router.get("/orders", amazonController.getAmazonOrders);
router.get("/logs", amazonController.getAmazonLogs);

// Product Mapping & Listing Upload endpoints
router.get("/products", amazonController.getMappedProducts);
router.put("/products/map", amazonController.updateProductMapping);
router.post("/products/upload", amazonController.uploadProductToAmazon);
router.post("/products/auto-map", amazonController.autoMapAllProducts);

module.exports = router;
