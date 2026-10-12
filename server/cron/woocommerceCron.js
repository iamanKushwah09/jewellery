const cron = require("node-cron");
const WooCommerceSetting = require("../models/WooCommerceSetting.model");
const WooCommerceSyncService = require("../services/woocommerce/woocommerceSync.service");

let wooCommerceCronJob = null;

/**
 * Start the WooCommerce automatic sync scheduler
 */
function startWooCommerceCron() {
  if (wooCommerceCronJob) {
    console.log("⏰ WooCommerce sync cron already initialized");
    return;
  }

  // Runs every 15 minutes by default
  wooCommerceCronJob = cron.schedule("*/15 * * * *", async () => {
    try {
      const settings = await WooCommerceSetting.findOne();
      if (!settings || !settings.isEnabled || !settings.autoSyncOrders) {
        return;
      }

      console.log("🏪 WooCommerce Cron: Running scheduled order synchronization...");
      const result = await WooCommerceSyncService.syncOrders("cron");
      console.log(`🏪 WooCommerce Cron: Done. Processed: ${result.processed}, Created: ${result.created}`);
    } catch (error) {
      console.error("🏪 WooCommerce Cron: Error during sync:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });

  console.log("🏪 WooCommerce background sync worker & cron scheduler active (Every 15 mins)");
}

/**
 * Stop the WooCommerce sync scheduler
 */
function stopWooCommerceCron() {
  if (wooCommerceCronJob) {
    wooCommerceCronJob.stop();
    wooCommerceCronJob = null;
    console.log("⏰ WooCommerce Cron: Stopped");
  }
}

/**
 * Restart or reconfigure the cron
 */
async function restartWooCommerceCron() {
  stopWooCommerceCron();
  const settings = await WooCommerceSetting.findOne();
  if (settings && settings.isEnabled) {
    startWooCommerceCron();
  }
}

module.exports = {
  startWooCommerceCron,
  stopWooCommerceCron,
  restartWooCommerceCron,
};
