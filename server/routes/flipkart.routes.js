const express = require("express");
const router = express.Router();
const flipkartController = require("../controller/flipkart.controller");
const { isAuth, isAdmin } = require("../config/auth");

// Public webhook endpoint for Flipkart
router.post("/webhook", flipkartController.handleWebhook);

// Protected Admin endpoints
router.get("/settings", flipkartController.getFlipkartSettings);
router.put("/settings", flipkartController.updateFlipkartSettings);
router.post("/test-connection", flipkartController.testConnection);
router.post("/sync-orders", flipkartController.triggerOrderSync);
router.post("/sync-inventory", flipkartController.triggerInventoryPush);
router.post("/simulate-order", flipkartController.simulateOrder);
router.get("/orders", flipkartController.getFlipkartOrders);
router.get("/logs", flipkartController.getFlipkartLogs);

// Product Mapping & Listing Upload endpoints
router.get("/products", flipkartController.getMappedProducts);
router.put("/products/map", flipkartController.updateProductMapping);
router.post("/products/upload", flipkartController.uploadProductToFlipkart);
router.post("/products/auto-map", flipkartController.autoMapAllProducts);

module.exports = router;
