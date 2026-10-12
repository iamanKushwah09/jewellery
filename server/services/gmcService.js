/**
 * Google Merchant Center (GMC) Auto-Sync Service
 * Uses Google Content API v2.1 for product feed management
 * 
 * Required ENV vars:
 *   GMC_MERCHANT_ID - Your Merchant Center ID
 *   GMC_SERVICE_ACCOUNT_KEY_PATH - Path to service account JSON key
 *   GMC_TARGET_COUNTRY - Target country (default: IN)
 *   GMC_CONTENT_LANGUAGE - Content language (default: en)
 *   STORE_DOMAIN - Your store domain (e.g., https://logicfirst.in)
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// GMC Configuration
const GMC_API_BASE = 'https://shoppingcontent.googleapis.com/content/v2.1';
const MERCHANT_ID = process.env.GMC_MERCHANT_ID || '';
const TARGET_COUNTRY = process.env.GMC_TARGET_COUNTRY || 'IN';
const CONTENT_LANGUAGE = process.env.GMC_CONTENT_LANGUAGE || 'en';
const STORE_DOMAIN = process.env.STORE_DOMAIN || process.env.BASE_URL || 'http://localhost:5056';

// Sync status tracking
let lastSyncStatus = {
  lastSync: null,
  totalSynced: 0,
  errors: [],
  status: 'idle' // idle | syncing | completed | error
};

/**
 * Get Google OAuth2 access token using service account
 */
async function getAccessToken() {
  try {
    const keyPath = process.env.GMC_SERVICE_ACCOUNT_KEY_PATH;
    if (!keyPath) {
      console.warn('⚠️ GMC_SERVICE_ACCOUNT_KEY_PATH not set. GMC sync disabled.');
      return null;
    }

    const resolvedPath = path.resolve(process.cwd(), keyPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`⚠️ GMC service account key not found at: ${resolvedPath}`);
      return null;
    }

    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: ['https://www.googleapis.com/auth/content'],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  } catch (error) {
    console.error('❌ GMC Auth Error:', error.message);
    return null;
  }
}

/**
 * Convert Item model to GMC Product format
 * @param {Object} item - MongoDB Item document
 * @returns {Object} GMC product data
 */
function itemToGMCProduct(item) {
  const baseUrl = STORE_DOMAIN.replace(/\/$/, '');
  const imageBaseUrl = (process.env.BASE_URL || 'http://localhost:5056').replace(/\/$/, '');

  // Build product image URL
  let imageLink = '';
  if (item.image && item.image.length > 0) {
    const firstImage = item.image[0];
    if (typeof firstImage === 'object' && firstImage.url) {
      imageLink = firstImage.url;
    } else if (typeof firstImage === 'string') {
      imageLink = firstImage;
    }
    // Make absolute URL
    if (imageLink && !imageLink.startsWith('http')) {
      imageLink = `${imageBaseUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
    }
  }

  // Build additional images
  const additionalImageLinks = [];
  if (item.image && item.image.length > 1) {
    for (let i = 1; i < Math.min(item.image.length, 10); i++) {
      let img = item.image[i];
      if (typeof img === 'object' && img.url) img = img.url;
      if (typeof img === 'string') {
        if (!img.startsWith('http')) {
          img = `${imageBaseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
        }
        additionalImageLinks.push(img);
      }
    }
  }

  // Generate a slug from the item name
  const slug = (item.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const product = {
    offerId: item.item_code || item._id.toString(),
    title: item.name || item.print_name || 'Untitled Product',
    description: item.long_description || item.short_description || item.name || '',
    link: `${baseUrl}/products/${slug}`,
    imageLink: imageLink || `${baseUrl}/logo.png`,
    additionalImageLinks: additionalImageLinks.length > 0 ? additionalImageLinks : undefined,
    contentLanguage: CONTENT_LANGUAGE,
    targetCountry: TARGET_COUNTRY,
    channel: 'online',
    availability: (item.stock && item.stock > 0) ? 'in_stock' : 'out_of_stock',
    condition: 'new',
    price: {
      value: String(item.sale_price || 0),
      currency: 'INR'
    },
    brand: 'Logic First Technologies',
    identifierExists: false,
  };

  // Add MRP as sale price if different from sale_price
  if (item.mrp && item.mrp > (item.sale_price || 0)) {
    // In GMC, "price" is the regular price, "salePrice" is the discounted price
    product.price = {
      value: String(item.mrp),
      currency: 'INR'
    };
    product.salePrice = {
      value: String(item.sale_price || 0),
      currency: 'INR'
    };
  }

  // Add GTIN if HSN code available
  if (item.hsn_code) {
    product.gtin = item.hsn_code;
    product.identifierExists = true;
  }

  // Add Google product category if mapped
  if (item.category_id && item.category_id.name) {
    product.productTypes = [item.category_id.name];
  }

  // Add item group for variants
  if (item.item_group_id) {
    const groupId = typeof item.item_group_id === 'object' 
      ? item.item_group_id._id?.toString() 
      : item.item_group_id.toString();
    product.itemGroupId = groupId;
  }

  // Tax info
  if (item.tax_gst) {
    product.taxes = [{
      country: TARGET_COUNTRY,
      rate: parseFloat(item.tax_gst) || 0,
      taxShip: false
    }];
  }

  return product;
}

/**
 * Sync a single product to Google Merchant Center
 * @param {Object} item - Item document (populated with category)
 */
async function syncProductToGMC(item) {
  if (!MERCHANT_ID) {
    console.log('ℹ️ GMC sync skipped — MERCHANT_ID not configured');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, reason: 'auth_failed' };
    }

    const product = itemToGMCProduct(item);
    const offerId = product.offerId;

    const response = await axios({
      method: 'POST',
      url: `${GMC_API_BASE}/${MERCHANT_ID}/products`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: product,
      timeout: 15000,
    });

    console.log(`✅ GMC: Synced product "${item.name}" (${offerId})`);
    return { success: true, productId: response.data?.id };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ GMC: Failed to sync "${item.name}":`, errMsg);
    return { success: false, reason: errMsg };
  }
}

/**
 * Delete a product from Google Merchant Center
 * @param {string} offerId - The product's offer ID (item_code or _id)
 */
async function deleteProductFromGMC(offerId) {
  if (!MERCHANT_ID) return { success: false, reason: 'not_configured' };

  try {
    const token = await getAccessToken();
    if (!token) return { success: false, reason: 'auth_failed' };

    const productId = `online:${CONTENT_LANGUAGE}:${TARGET_COUNTRY}:${offerId}`;

    await axios({
      method: 'DELETE',
      url: `${GMC_API_BASE}/${MERCHANT_ID}/products/${encodeURIComponent(productId)}`,
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 15000,
    });

    console.log(`✅ GMC: Deleted product ${offerId}`);
    return { success: true };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ GMC: Failed to delete ${offerId}:`, errMsg);
    return { success: false, reason: errMsg };
  }
}

/**
 * Batch sync all active products to GMC
 */
async function batchSyncAllProducts() {
  const Item = require('../models/item.model');

  lastSyncStatus = {
    lastSync: new Date(),
    totalSynced: 0,
    errors: [],
    status: 'syncing'
  };

  try {
    const items = await Item.find({ is_active: true, showOnWebsite: true })
      .populate('category_id', 'name')
      .populate('item_group_id', 'name')
      .populate('brand_id', 'name')
      .populate('unit_id', 'name')
      .lean();

    console.log(`📦 GMC: Starting batch sync of ${items.length} products...`);

    let successCount = 0;
    const errors = [];

    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(item => syncProductToGMC(item))
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          const reason = result.status === 'fulfilled' 
            ? result.value.reason 
            : result.reason?.message;
          errors.push({
            itemId: batch[idx]._id,
            itemName: batch[idx].name,
            error: reason
          });
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    lastSyncStatus = {
      lastSync: new Date(),
      totalSynced: successCount,
      totalItems: items.length,
      errors: errors.slice(0, 50), // Keep max 50 errors
      status: errors.length === 0 ? 'completed' : 'completed_with_errors'
    };

    console.log(`📦 GMC: Batch sync complete. ${successCount}/${items.length} synced. ${errors.length} errors.`);
    return lastSyncStatus;
  } catch (error) {
    lastSyncStatus.status = 'error';
    lastSyncStatus.errors.push({ error: error.message });
    console.error('❌ GMC: Batch sync failed:', error.message);
    return lastSyncStatus;
  }
}

/**
 * Get current sync status
 */
function getSyncStatus() {
  return lastSyncStatus;
}

module.exports = {
  syncProductToGMC,
  deleteProductFromGMC,
  batchSyncAllProducts,
  getSyncStatus,
  itemToGMCProduct,
};
