/**
 * GMC Controller
 * Admin endpoints for GMC sync triggers, queue metrics, audit logs, and manual retries
 */

const Item = require('../models/item.model');
const GmcSyncLog = require('../models/GmcSyncLog.model');
const { 
  syncProductToGMC, 
  deleteProductFromGMC, 
  batchSyncAllProducts,
  reconcileUnsyncedProducts
} = require('../services/gmc/gmcProductService');
const { enqueueGmcJob, getQueueMetrics } = require('../services/gmc/gmcQueue');

// In-memory batch sync progress tracker
let currentBatchStatus = {
  status: 'idle', // idle | syncing | completed | error
  startedAt: null,
  total: 0,
  processed: 0,
  successCount: 0,
  failCount: 0,
  errors: []
};

/**
 * Trigger full catalog batch sync (runs in background)
 * POST /api/gmc/sync
 */
exports.triggerBatchSync = async (req, res) => {
  try {
    if (currentBatchStatus.status === 'syncing') {
      return res.status(409).json({
        message: 'A batch synchronization is already in progress',
        progress: currentBatchStatus
      });
    }

    currentBatchStatus = {
      status: 'syncing',
      startedAt: new Date(),
      total: 0,
      processed: 0,
      successCount: 0,
      failCount: 0,
      errors: []
    };

    // Respond immediately with 202 Accepted
    res.status(202).json({
      message: 'GMC catalog batch sync started in background',
      status: 'syncing'
    });

    // Run batch sync asynchronously in background
    batchSyncAllProducts({}, (progress) => {
      currentBatchStatus.total = progress.total;
      currentBatchStatus.processed = progress.processed;
      currentBatchStatus.successCount = progress.successCount;
      currentBatchStatus.failCount = progress.failCount;
    })
      .then((summary) => {
        currentBatchStatus.status = 'completed';
        currentBatchStatus.errors = summary.errors;
        console.log('✅ GMC: Background batch sync finished successfully');
      })
      .catch((err) => {
        currentBatchStatus.status = 'error';
        currentBatchStatus.errors = [{ error: err.message }];
        console.error('❌ GMC: Background batch sync error:', err.message);
      });

  } catch (error) {
    res.status(500).json({ message: 'Failed to start batch sync', error: error.message });
  }
};

/**
 * Get comprehensive GMC sync status & catalog metrics
 * GET /api/gmc/status
 */
exports.getGmcStatus = async (req, res) => {
  try {
    const [
      totalActive,
      syncedCount,
      pendingCount,
      failedCount,
      lastLog,
      queueMetrics
    ] = await Promise.all([
      Item.countDocuments({ is_active: true, showOnWebsite: { $ne: false } }),
      Item.countDocuments({ 'gmc.status': 'SYNCED' }),
      Item.countDocuments({ $or: [{ 'gmc.status': 'PENDING' }, { 'gmc.status': { $exists: false } }] }),
      Item.countDocuments({ 'gmc.status': 'FAILED' }),
      GmcSyncLog.findOne().sort({ createdAt: -1 }).lean(),
      getQueueMetrics()
    ]);

    res.status(200).json({
      catalog: {
        totalActive,
        synced: syncedCount,
        pending: pendingCount,
        failed: failedCount,
        syncPercentage: totalActive > 0 ? Math.round((syncedCount / totalActive) * 100) : 0
      },
      batchStatus: currentBatchStatus,
      queue: queueMetrics,
      lastSync: lastLog ? {
        action: lastLog.action,
        status: lastLog.status,
        timestamp: lastLog.createdAt,
        error: lastLog.error
      } : null,
      configured: Boolean(process.env.GMC_MERCHANT_ID)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch GMC status', error: error.message });
  }
};

/**
 * Sync single product immediately or via queue
 * POST /api/gmc/product/:id
 */
exports.syncSingleProduct = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const result = await syncProductToGMC(item, 'MANUAL_SYNC');
    if (result.success) {
      res.status(200).json({
        message: 'Product synchronized with Google Merchant Center successfully',
        offerId: result.offerId
      });
    } else {
      res.status(400).json({
        message: 'Google Merchant Center synchronization failed',
        error: result.error,
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sync error', error: error.message });
  }
};

/**
 * Retry failed product sync
 * POST /api/gmc/product/:id/retry
 */
exports.retryProductSync = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Enqueue retry with immediate execution
    await enqueueGmcJob({ action: 'UPDATE', itemId: item._id }, 0);

    res.status(200).json({
      message: 'Retry job enqueued for product',
      itemId: item._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enqueue retry', error: error.message });
  }
};

/**
 * Delete a product from GMC
 * DELETE /api/gmc/product/:id
 */
exports.deleteSingleProduct = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const offerId = item.item_code || item._id.toString();
    const result = await deleteProductFromGMC(offerId, item._id);

    if (result.success) {
      res.status(200).json({ message: 'Product removed from Google Merchant Center' });
    } else {
      res.status(400).json({ message: 'Failed to delete from GMC', error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Delete error', error: error.message });
  }
};

/**
 * Get paginated GMC audit logs
 * GET /api/gmc/logs
 */
exports.getGmcLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.action) query.action = req.query.action;
    if (req.query.itemId) query.itemId = req.query.itemId;

    const [logs, total] = await Promise.all([
      GmcSyncLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('itemId', 'name item_code sale_price mrp image')
        .lean(),
      GmcSyncLog.countDocuments(query)
    ]);

    res.status(200).json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve logs', error: error.message });
  }
};
