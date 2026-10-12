const cron = require("node-cron");
const AmazonSetting = require("../models/AmazonSetting.model");
const AmazonSyncService = require("../services/amazon/amazonSync.service");

let amazonCronJob = null;

/**
 * Start the Amazon automatic sync scheduler
 */
function startAmazonCron() {
  if (amazonCronJob) {
    console.log("⏰ Amazon sync cron already initialized");
    return;
  }

  // Runs every 15 minutes by default
  amazonCronJob = cron.schedule("*/15 * * * *", async () => {
    try {
      const settings = await AmazonSetting.findOne();
      if (!settings || !settings.isEnabled || !settings.autoSyncOrders) {
        return;
      }

      console.log("⏰ Amazon Cron: Running scheduled order synchronization...");
      const result = await AmazonSyncService.syncOrders("cron");
      console.log(`⏰ Amazon Cron: Done. Processed: ${result.ordersProcessed}, Created: ${result.ordersCreated}`);
    } catch (error) {
      console.error("⏰ Amazon Cron: Error during sync:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });

  console.log("📦 Amazon background sync worker & cron scheduler active (Every 15 mins)");
}

/**
 * Stop the Amazon sync scheduler
 */
function stopAmazonCron() {
  if (amazonCronJob) {
    amazonCronJob.stop();
    amazonCronJob = null;
    console.log("⏰ Amazon Cron: Stopped");
  }
}

/**
 * Restart or reconfigure the cron with new interval
 */
async function restartAmazonCron() {
  stopAmazonCron();
  const settings = await AmazonSetting.findOne();
  if (settings && settings.isEnabled) {
    startAmazonCron();
  }
}

module.exports = {
  startAmazonCron,
  stopAmazonCron,
  restartAmazonCron,
};
