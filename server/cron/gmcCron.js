/**
 * GMC Cron Job — Periodic batch sync fallback
 * Runs every 6 hours to ensure GMC catalog stays in sync
 */

const cron = require('node-cron');
const { batchSyncAllProducts, getSyncStatus } = require('../services/gmcService');

let gmcCronJob = null;

/**
 * Start the GMC auto-sync cron job
 * Runs every 6 hours: 0 star/6 star star star
 */
function startGMCCron() {
  if (gmcCronJob) {
    console.log('⏰ GMC cron already running');
    return;
  }

  // Run every 6 hours
  gmcCronJob = cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ GMC Cron: Starting scheduled batch sync...');
    try {
      const result = await batchSyncAllProducts();
      console.log(`⏰ GMC Cron: Completed. Status: ${result.status}, Synced: ${result.totalSynced}/${result.totalItems}`);
    } catch (error) {
      console.error('⏰ GMC Cron: Error during scheduled sync:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  console.log('⏰ GMC Cron: Scheduled for every 6 hours (IST)');
}

/**
 * Stop the GMC cron job
 */
function stopGMCCron() {
  if (gmcCronJob) {
    gmcCronJob.stop();
    gmcCronJob = null;
    console.log('⏰ GMC Cron: Stopped');
  }
}

module.exports = { startGMCCron, stopGMCCron };
