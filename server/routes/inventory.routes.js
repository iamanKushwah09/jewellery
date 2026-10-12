const express = require("express");
const router = express.Router();
const inventoryController = require("../controller/inventory.controller");

router.route("/")
  .get(inventoryController.getAllInventoryLogs);

router.route("/sources")
  .get(inventoryController.getInventorySources);

router.route("/item/:itemId")
  .get(inventoryController.getItemInventoryHistory);

module.exports = router;
