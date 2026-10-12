/**
 * GMC Catalog Reconciliation Cron Job
 * Runs daily at 03:00 AM IST to catch and sync any failed or pending products
 */

const cron = require('node-cron');
const { reconcileUnsyncedProducts } = require('../services/gmc/gmcProductService');

let reconciliationJob = null;

function startGmcReconciliationCron() {
  if (reconciliationJob) {
    return;
  }

  // Schedule daily at 03:00 AM IST
  reconciliationJob = cron.schedule('0 3 * * *', async () => {
    console.log('⏰ GMC Reconciliation Cron: Starting daily sync audit...');
    try {
      const results = await reconcileUnsyncedProducts();
      console.log(`⏰ GMC Reconciliation Cron: Completed. ${results.successCount} synced, ${results.failCount} failed.`);
    } catch (error) {
      console.error('⏰ GMC Reconciliation Cron Error:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  console.log('⏰ GMC Reconciliation Cron: Scheduled daily at 03:00 AM (Asia/Kolkata)');
}

function stopGmcReconciliationCron() {
  if (reconciliationJob) {
    reconciliationJob.stop();
    reconciliationJob = null;
    console.log('⏰ GMC Reconciliation Cron: Stopped');
  }
}

module.exports = {
  startGmcReconciliationCron,
  stopGmcReconciliationCron
};
