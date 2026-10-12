const cron = require("node-cron");
const FlipkartSetting = require("../models/FlipkartSetting.model");
const FlipkartSyncService = require("../services/flipkart/flipkartSync.service");

let flipkartCronJob = null;

/**
 * Start the Flipkart automatic sync scheduler
 */
function startFlipkartCron() {
  if (flipkartCronJob) {
    console.log("⏰ Flipkart sync cron already initialized");
    return;
  }

  // Runs every 15 minutes by default
  flipkartCronJob = cron.schedule("*/15 * * * *", async () => {
    try {
      const settings = await FlipkartSetting.findOne();
      if (!settings || !settings.isEnabled || !settings.autoSyncOrders) {
        return;
      }

      console.log("⏰ Flipkart Cron: Running scheduled order synchronization...");
      const result = await FlipkartSyncService.syncOrders("cron");
      console.log(`⏰ Flipkart Cron: Done. Processed: ${result.ordersProcessed}, Created: ${result.ordersCreated}`);
    } catch (error) {
      console.error("⏰ Flipkart Cron: Error during sync:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });

  console.log("🛒 Flipkart background sync worker & cron scheduler active (Every 15 mins)");
}

/**
 * Stop the Flipkart sync scheduler
 */
function stopFlipkartCron() {
  if (flipkartCronJob) {
    flipkartCronJob.stop();
    flipkartCronJob = null;
    console.log("⏰ Flipkart Cron: Stopped");
  }
}

/**
 * Restart or reconfigure the cron with new interval
 */
async function restartFlipkartCron() {
  stopFlipkartCron();
  const settings = await FlipkartSetting.findOne();
  if (settings && settings.isEnabled) {
    startFlipkartCron();
  }
}

module.exports = {
  startFlipkartCron,
  stopFlipkartCron,
  restartFlipkartCron,
};
