/**
 * GMC Synchronization Queue
 * BullMQ-powered background queue with automatic in-memory fallback and job deduplication
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

const QUEUE_NAME = 'gmc-product-sync';
let gmcQueue = null;
let redisClient = null;
let useRedisQueue = false;

// Fallback in-memory task runner
const inMemoryQueue = [];
let isProcessingFallback = false;

/**
 * Initialize Redis and BullMQ Queue
 */
function initGmcQueue() {
  const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ GMC Queue: Redis not reachable. Falling back to in-memory asynchronous queue.');
        useRedisQueue = false;
        return null; // Stop retrying Redis
      }
      return Math.min(times * 1000, 3000);
    }
  };

  try {
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    redisClient.on('connect', () => {
      console.log('✅ GMC Queue: Connected to Redis');
      useRedisQueue = true;
    });

    redisClient.on('error', (err) => {
      if (useRedisQueue) {
        console.warn('⚠️ GMC Queue: Redis disconnected, using in-memory queue:', err.message);
      }
      useRedisQueue = false;
    });

    gmcQueue = new Queue(QUEUE_NAME, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    gmcQueue.on('error', () => {
      useRedisQueue = false;
    });

    useRedisQueue = true;
    console.log('🚀 GMC Queue: BullMQ queue initialized');
  } catch (error) {
    console.warn('⚠️ GMC Queue: Could not initialize BullMQ, using in-memory queue fallback:', error.message);
    useRedisQueue = false;
  }
}

/**
 * Process fallback in-memory queue
 */
async function processFallbackQueue() {
  if (isProcessingFallback || inMemoryQueue.length === 0) return;
  isProcessingFallback = true;

  const { syncProductToGMC, deleteProductFromGMC } = require('./gmcProductService');

  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift();
    try {
      if (job.action === 'DELETE') {
        await deleteProductFromGMC(job.offerId, job.itemId);
      } else {
        await syncProductToGMC(job.itemId, job.action);
      }
    } catch (err) {
      console.error(`❌ GMC In-Memory Worker Error for ${job.itemId || job.offerId}:`, err.message);
    }
    // Small pause between jobs
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  isProcessingFallback = false;
}

/**
 * Enqueue a GMC synchronization job with debouncing / deduplication
 * @param {Object} jobData 
 * @param {string} jobData.action - 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_UPDATE' | 'IMAGE_UPDATE' | 'PRICE_UPDATE'
 * @param {string} [jobData.itemId] - MongoDB Item ObjectId
 * @param {string} [jobData.offerId] - GMC Offer ID
 * @param {number} [delay=1000] - Debounce delay in ms
 */
async function enqueueGmcJob(jobData, delay = 1000) {
  const { action, itemId, offerId } = jobData;
  const targetId = itemId ? itemId.toString() : offerId;

  if (!targetId) {
    console.warn('⚠️ GMC Queue: enqueue called without itemId or offerId');
    return;
  }

  // Deduplication Job ID: ensure multiple rapid updates within `delay` ms coalesce
  const jobId = `gmc-${action === 'DELETE' ? 'del' : 'sync'}-${targetId}`;

  if (useRedisQueue && gmcQueue) {
    try {
      // Remove any pending delayed job for this item to debounce
      const existingJob = await gmcQueue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove().catch(() => {});
      }

      await gmcQueue.add(
        action,
        { action, itemId, offerId },
        {
          jobId,
          delay, // Debounce delay
        }
      );
      return;
    } catch (err) {
      console.warn('⚠️ GMC Queue: Failed to add job to Redis, switching to in-memory fallback:', err.message);
      useRedisQueue = false;
    }
  }

  // In-memory fallback
  // Coalesce existing item in array
  const existingIdx = inMemoryQueue.findIndex(j => (j.itemId && j.itemId.toString() === targetId) || j.offerId === targetId);
  if (existingIdx !== -1) {
    inMemoryQueue.splice(existingIdx, 1);
  }

  inMemoryQueue.push(jobData);
  setTimeout(() => {
    processFallbackQueue().catch(e => console.error('Fallback queue error:', e));
  }, delay);
}

/**
 * Get queue metrics
 */
async function getQueueMetrics() {
  if (useRedisQueue && gmcQueue) {
    try {
      const counts = await gmcQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
      return {
        mode: 'redis_bullmq',
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed
      };
    } catch (e) {
      // ignore
    }
  }
  return {
    mode: 'in_memory_fallback',
    pending: inMemoryQueue.length,
    active: isProcessingFallback ? 1 : 0
  };
}

module.exports = {
  initGmcQueue,
  enqueueGmcJob,
  getQueueMetrics,
  QUEUE_NAME
};
