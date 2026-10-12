const express = require("express");
const router = express.Router();
const {
  getShopifySettings,
  updateShopifySettings,
  testShopifyConnection,
  triggerShopifySync,
  getShopifyOrders,
  handleShopifyWebhook,
} = require("../controller/shopify.controller");

// Settings endpoints
router.get("/settings", getShopifySettings);
router.post("/settings", updateShopifySettings);

// Actions
router.post("/test-connection", testShopifyConnection);
router.post("/sync-now", triggerShopifySync);

// Orders
router.get("/orders", getShopifyOrders);

// Webhook listener
router.post("/webhook", handleShopifyWebhook);

module.exports = router;
