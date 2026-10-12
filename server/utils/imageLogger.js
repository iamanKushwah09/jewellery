const ImageUpdateLog = require('../models/imageUpdateLog.model');

/**
 * Log any image change on an item.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.item_id
 * @param {number}          params.item_code
 * @param {string}          params.item_name
 * @param {Array}           params.previous_images  - images before update
 * @param {Array}           params.new_images        - images after update
 * @param {string}          params.triggered_by      - 'admin_manual' | 'sync_cron' | 'sync_api' | 'image_update_drawer' | 'system_update' | 'unknown'
 * @param {string}          [params.changed_by_email]
 * @param {string|ObjectId} [params.changed_by_id]
 * @param {string}          [params.notes]
 * @param {Object}          [params.req]             - express req object (optional, for IP/UA)
 */
async function logImageChange(params) {
  try {
    const {
      item_id,
      item_code,
      item_name,
      previous_images = [],
      new_images = [],
      triggered_by = 'unknown',
      changed_by_email = null,
      changed_by_id = null,
      notes = '',
      req = null,
    } = params;

    // Detect destructive change: had images before, now has none or only default
    const prevCount = Array.isArray(previous_images) ? previous_images.filter(Boolean).length : 0;
    const newCount  = Array.isArray(new_images)      ? new_images.filter(Boolean).length      : 0;
    const defaultPath = '/default/default_image.png';
    const isNowDefault = newCount === 0 || (newCount === 1 && (new_images[0] === defaultPath || new_images[0]?.url === defaultPath));
    const is_destructive = prevCount > 0 && isNowDefault;

    await ImageUpdateLog.create({
      item_id,
      item_code,
      item_name,
      previous_images,
      new_images,
      triggered_by,
      changed_by_email,
      changed_by_id,
      is_destructive,
      notes,
      request_ip: req ? (req.ip || req.headers?.['x-forwarded-for']) : null,
      request_user_agent: req ? req.headers?.['user-agent'] : null,
    });

    if (is_destructive) {
      console.warn(
        `⚠️  [ImageLog] DESTRUCTIVE image change on item_code=${item_code} name="${item_name}" ` +
        `triggered_by=${triggered_by} changed_by=${changed_by_email || 'system'} ` +
        `prev_count=${prevCount} new_count=${newCount}`
      );
    } else {
      console.log(
        `📷 [ImageLog] Image updated on item_code=${item_code} ` +
        `triggered_by=${triggered_by} prev=${prevCount} → new=${newCount}`
      );
    }
  } catch (err) {
    // Never let logging break the main flow
    console.error('[ImageLog] Failed to write image log:', err.message);
  }
}

module.exports = { logImageChange };
