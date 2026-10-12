/**
 * GMC Worker Process
 * BullMQ worker that processes GMC sync jobs with exponential backoff and error classification
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { QUEUE_NAME } = require('./gmcQueue');
const { syncProductToGMC, deleteProductFromGMC } = require('./gmcProductService');

let gmcWorker = null;

/**
 * Initialize BullMQ Worker
 */
function initGmcWorker() {
  const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    }
  };

  try {
    const connection = process.env.REDIS_URL 
      ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
      : new Redis(redisConfig);

    connection.on('error', () => {
      // Handled silently
    });

    gmcWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { action, itemId, offerId } = job.data;
        console.log(`🔨 GMC Worker: Processing job ${job.id} [${action}] for item: ${itemId || offerId} (Attempt ${job.attemptsMade + 1})`);

        try {
          if (action === 'DELETE') {
            const res = await deleteProductFromGMC(offerId, itemId);
            if (!res.success) {
              throw new Error(res.error || 'Failed to delete from GMC');
            }
            return { action: 'DELETE', offerId, success: true };
          } else {
            const res = await syncProductToGMC(itemId, action);
            if (!res.success) {
              // Check if permanent validation error
              const nonRetryableCodes = ['VALIDATION_ERROR', 'IMAGE_ERROR', 'PRODUCT_DATA_ERROR', 'PERMISSION_ERROR'];
              if (res.errorCode && nonRetryableCodes.includes(res.errorCode)) {
                console.warn(`🛑 GMC Worker: Non-retryable error [${res.errorCode}]: ${res.error}. Aborting retries.`);
                // Do not throw to avoid infinite retries on unfixable product data
                return { action, itemId, success: false, reason: res.error, permanent: true };
              }
              throw new Error(res.error || 'GMC sync failed');
            }
            return { action, itemId, success: true, offerId: res.offerId };
          }
        } catch (error) {
          console.error(`❌ GMC Worker Error (Job ${job.id}):`, error.message);
          throw error; // Triggers BullMQ exponential retry
        }
      },
      {
        connection,
        concurrency: parseInt(process.env.GMC_CONCURRENCY || '5', 10),
        limiter: {
          max: 10,
          duration: 1000 // Rate limit: max 10 requests per second
        }
      }
    );

    gmcWorker.on('completed', (job, result) => {
      console.log(`🎉 GMC Worker: Job ${job.id} completed successfully`);
    });

    gmcWorker.on('failed', (job, err) => {
      console.error(`💥 GMC Worker: Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${err.message}`);
    });

    gmcWorker.on('error', () => {
      // Suppress unhandled Redis reconnection errors when offline
    });

    console.log('🚀 GMC Worker: Worker process initialized');
  } catch (error) {
    console.warn('⚠️ GMC Worker: Could not start BullMQ worker:', error.message);
  }
}

/**
 * Gracefully close worker on shutdown
 */
async function closeGmcWorker() {
  if (gmcWorker) {
    await gmcWorker.close();
    gmcWorker = null;
    console.log('🛑 GMC Worker: Closed');
  }
}

module.exports = {
  initGmcWorker,
  closeGmcWorker
};
