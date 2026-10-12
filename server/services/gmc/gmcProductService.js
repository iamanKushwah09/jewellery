/**
 * GMC Product Service
 * Core business operations for syncing, updating, deleting, and auditing products in Google Merchant Center
 */

const Item = require('../../models/item.model');
const GmcSyncLog = require('../../models/GmcSyncLog.model');
const { request, MERCHANT_ID } = require('./gmcClient');
const { mapItemToGMC, TARGET_COUNTRY, CONTENT_LANGUAGE } = require('./gmcMapper');

/**
 * Format Google Merchant Center product ID
 * Standard format: online:language:country:offerId
 */
function buildGmcProductId(offerId) {
  return `online:${CONTENT_LANGUAGE}:${TARGET_COUNTRY}:${offerId}`;
}

/**
 * Sync a single Item (and its variants if present) to Google Merchant Center
 * @param {Object|string} itemOrId - MongoDB Item document or ID
 * @param {string} [action='UPDATE'] - Trigger action
 * @returns {Promise<{ success: boolean, offerId?: string, error?: string, errorCode?: string }>}
 */
async function syncProductToGMC(itemOrId, action = 'UPDATE') {
  let item = itemOrId;
  if (typeof itemOrId === 'string' || itemOrId instanceof require('mongoose').Types.ObjectId) {
    item = await Item.findById(itemOrId)
      .populate('category_id', 'name')
      .populate('item_group_id', 'name')
      .populate('brand_id', 'name')
      .populate('unit_id', 'name')
      .lean();
  }

  if (!item) {
    return { success: false, error: 'Product not found in database', errorCode: 'PRODUCT_DATA_ERROR' };
  }

  // If item is not active or hidden from website, remove from GMC if it was previously synced
  if (!item.is_active || item.showOnWebsite === false) {
    const offerId = item.item_code || item._id.toString();
    await deleteProductFromGMC(offerId, item._id);
    await Item.findByIdAndUpdate(item._id, {
      $set: {
        'gmc.synced': false,
        'gmc.status': 'PENDING',
        'gmc.lastError': 'Product inactive or hidden from website'
      }
    });
    return { success: true, message: 'Inactive product removed from GMC' };
  }

  // Determine if product has variants
  const variants = item.item_attribute?.variant;
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  // Mark status as SYNCING in MongoDB
  await Item.findByIdAndUpdate(item._id, {
    $set: { 'gmc.status': 'SYNCING' }
  });

  const syncResults = [];

  if (hasVariants) {
    // Sync each variant as an individual GMC product with common itemGroupId
    for (const variant of variants) {
      const payload = mapItemToGMC(item, variant);
      const res = await sendProductPayload(item._id, payload, action);
      syncResults.push(res);
    }
  } else {
    // Single product sync
    const payload = mapItemToGMC(item);
    const res = await sendProductPayload(item._id, payload, action);
    syncResults.push(res);
  }

  // Evaluate overall success
  const allSuccess = syncResults.every(r => r.success);
  const mainResult = syncResults[0] || { success: false, error: 'No payload generated' };

  if (allSuccess) {
    await Item.findByIdAndUpdate(item._id, {
      $set: {
        'gmc.synced': true,
        'gmc.status': 'SYNCED',
        'gmc.offerId': mainResult.offerId,
        'gmc.productName': mainResult.productName || null,
        'gmc.lastSyncedAt': new Date(),
        'gmc.lastError': null,
        'gmc.attempts': 0
      }
    });
    return { success: true, offerId: mainResult.offerId };
  } else {
    const failedItem = syncResults.find(r => !r.success) || mainResult;
    await Item.findByIdAndUpdate(item._id, {
      $set: {
        'gmc.synced': false,
        'gmc.status': 'FAILED',
        'gmc.lastError': failedItem.error || 'Sync failed',
      },
      $inc: { 'gmc.attempts': 1 }
    });
    return { 
      success: false, 
      error: failedItem.error, 
      errorCode: failedItem.errorCode 
    };
  }
}

/**
 * Send payload to Google Merchant API and record audit log
 * @param {ObjectId} itemId 
 * @param {Object} payload 
 * @param {string} action 
 * @returns {Promise<Object>}
 */
async function sendProductPayload(itemId, payload, action) {
  const startedAt = new Date();
  const logEntry = new GmcSyncLog({
    itemId,
    offerId: payload.offerId,
    action: action || 'UPDATE',
    status: 'PENDING',
    payload,
    startedAt
  });

  try {
    if (!MERCHANT_ID) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'GMC_MERCHANT_ID is not configured in environment variables'
      };
    }

    // Google Content API / Merchant API insert or update
    const response = await request({
      method: 'POST',
      url: `/${MERCHANT_ID}/products`,
      data: payload
    });

    logEntry.status = 'SUCCESS';
    logEntry.response = response;
    logEntry.requestId = response?.id || null;
    logEntry.completedAt = new Date();
    await logEntry.save();

    console.log(`✅ GMC: Successfully synced product "${payload.title}" (${payload.offerId})`);
    return { 
      success: true, 
      offerId: payload.offerId, 
      productName: response?.id 
    };
  } catch (error) {
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Unknown GMC sync error';

    logEntry.status = 'FAILED';
    logEntry.errorCode = errorCode;
    logEntry.error = errorMessage;
    logEntry.completedAt = new Date();
    await logEntry.save().catch(e => console.error('Failed to save GMC error log:', e));

    console.error(`❌ GMC: Sync failed for "${payload.title}" (${payload.offerId}): [${errorCode}] ${errorMessage}`);
    return {
      success: false,
      offerId: payload.offerId,
      error: errorMessage,
      errorCode
    };
  }
}

/**
 * Delete a product from Google Merchant Center
 * @param {string} offerId 
 * @param {ObjectId} [itemId] 
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function deleteProductFromGMC(offerId, itemId = null) {
  const startedAt = new Date();
  const logEntry = new GmcSyncLog({
    itemId,
    offerId,
    action: 'DELETE',
    status: 'PENDING',
    startedAt
  });

  try {
    if (!MERCHANT_ID) {
      return { success: true, message: 'GMC not configured' };
    }

    const productId = buildGmcProductId(offerId);
    const encodedId = encodeURIComponent(productId);

    const response = await request({
      method: 'DELETE',
      url: `/${MERCHANT_ID}/products/${encodedId}`
    });

    logEntry.status = 'SUCCESS';
    logEntry.response = response;
    logEntry.completedAt = new Date();
    await logEntry.save();

    if (itemId) {
      await Item.findByIdAndUpdate(itemId, {
        $set: {
          'gmc.synced': false,
          'gmc.status': 'PENDING',
          'gmc.lastSyncedAt': null
        }
      });
    }

    console.log(`✅ GMC: Deleted product offerId: ${offerId}`);
    return { success: true };
  } catch (error) {
    // If product already doesn't exist on GMC (404), treat delete as success
    if (error.code === 'PRODUCT_DATA_ERROR' || error.status === 404) {
      logEntry.status = 'SUCCESS';
      logEntry.completedAt = new Date();
      await logEntry.save().catch(() => {});
      return { success: true };
    }

    logEntry.status = 'FAILED';
    logEntry.errorCode = error.code || 'UNKNOWN_ERROR';
    logEntry.error = error.message;
    logEntry.completedAt = new Date();
    await logEntry.save().catch(() => {});

    console.error(`❌ GMC: Failed to delete ${offerId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Perform a controlled batch synchronization of all active catalog items
 * @param {Object} queryFilter - Optional MongoDB filter
 * @param {Function} [progressCallback]
 * @returns {Promise<Object>}
 */
async function batchSyncAllProducts(queryFilter = {}, progressCallback = null) {
  const filter = {
    is_active: true,
    showOnWebsite: { $ne: false },
    ...queryFilter
  };

  const items = await Item.find(filter)
    .populate('category_id', 'name')
    .populate('item_group_id', 'name')
    .populate('brand_id', 'name')
    .populate('unit_id', 'name')
    .lean();

  const total = items.length;
  console.log(`📦 GMC: Starting batch sync of ${total} active items...`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];
  const batchSize = 10;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      chunk.map(item => syncProductToGMC(item, 'BATCH_SYNC'))
    );

    results.forEach((res, idx) => {
      const currentItem = chunk[idx];
      if (res.status === 'fulfilled' && res.value.success) {
        successCount++;
      } else {
        failCount++;
        const errorMsg = res.status === 'fulfilled' ? res.value.error : res.reason?.message;
        errors.push({
          itemId: currentItem._id,
          name: currentItem.name,
          error: errorMsg
        });
      }
    });

    if (typeof progressCallback === 'function') {
      progressCallback({
        processed: Math.min(i + batchSize, total),
        total,
        successCount,
        failCount
      });
    }

    // Respect Google API rate limits with small pause between batches
    if (i + batchSize < total) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`📦 GMC: Batch sync complete. ${successCount}/${total} succeeded, ${failCount} failed.`);
  return {
    total,
    successCount,
    failCount,
    errors: errors.slice(0, 50),
    completedAt: new Date()
  };
}

/**
 * Reconcile unsynced or failed products
 */
async function reconcileUnsyncedProducts() {
  console.log('🔄 GMC: Running scheduled catalog reconciliation...');
  return await batchSyncAllProducts({
    $or: [
      { 'gmc.synced': false },
      { 'gmc.status': { $in: ['PENDING', 'FAILED'] } },
      { 'gmc.status': { $exists: false } }
    ]
  });
}

module.exports = {
  syncProductToGMC,
  deleteProductFromGMC,
  batchSyncAllProducts,
  reconcileUnsyncedProducts,
  buildGmcProductId
};
