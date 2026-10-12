const cron = require("node-cron");
const ShopifySetting = require("../models/ShopifySetting.model");
const ShopifySyncService = require("../services/shopify/shopifySync.service");

let shopifyCronJob = null;

/**
 * Start the Shopify automatic sync scheduler
 */
function startShopifyCron() {
  if (shopifyCronJob) {
    console.log("⏰ Shopify sync cron already initialized");
    return;
  }

  // Runs every 15 minutes by default
  shopifyCronJob = cron.schedule("*/15 * * * *", async () => {
    try {
      const settings = await ShopifySetting.findOne();
      if (!settings || !settings.isEnabled || !settings.autoSyncOrders) {
        return;
      }

      console.log("🛍️ Shopify Cron: Running scheduled order synchronization...");
      const result = await ShopifySyncService.syncOrders("cron");
      console.log(`🛍️ Shopify Cron: Done. Processed: ${result.processed}, Created: ${result.created}`);
    } catch (error) {
      console.error("🛍️ Shopify Cron: Error during sync:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });

  console.log("🛍️ Shopify background sync worker & cron scheduler active (Every 15 mins)");
}

/**
 * Stop the Shopify sync scheduler
 */
function stopShopifyCron() {
  if (shopifyCronJob) {
    shopifyCronJob.stop();
    shopifyCronJob = null;
    console.log("⏰ Shopify Cron: Stopped");
  }
}

/**
 * Restart or reconfigure the cron
 */
async function restartShopifyCron() {
  stopShopifyCron();
  const settings = await ShopifySetting.findOne();
  if (settings && settings.isEnabled) {
    startShopifyCron();
  }
}

module.exports = {
  startShopifyCron,
  stopShopifyCron,
  restartShopifyCron,
};
