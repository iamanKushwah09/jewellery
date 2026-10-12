const express = require("express");
const router = express.Router();
const {
  getWooCommerceSettings,
  updateWooCommerceSettings,
  testWooCommerceConnection,
  triggerWooCommerceSync,
  getWooCommerceOrders,
  handleWooCommerceWebhook,
} = require("../controller/woocommerce.controller");

// Settings endpoints
router.get("/settings", getWooCommerceSettings);
router.post("/settings", updateWooCommerceSettings);

// Actions
router.post("/test-connection", testWooCommerceConnection);
router.post("/sync-now", triggerWooCommerceSync);

// Orders
router.get("/orders", getWooCommerceOrders);

// Webhook listener
router.post("/webhook", handleWooCommerceWebhook);

module.exports = router;
