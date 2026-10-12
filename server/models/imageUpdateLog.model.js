const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ImageUpdateLog — Audit trail for every image change on an item.
 * Records who changed it, when, from what to what, and why (trigger source).
 */
const ImageUpdateLogSchema = new Schema({
  // Which item was affected
  item_id: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  item_code: { type: Number },
  item_name: { type: String },

  // What the images were BEFORE the change
  previous_images: [{ type: Object }],   // array of relative paths or objects

  // What the images became AFTER the change
  new_images: [{ type: Object }],        // array of relative paths or objects

  // Who/what triggered this change
  triggered_by: {
    type: String,
    enum: ['admin_manual', 'sync_cron', 'sync_api', 'system_update', 'image_update_drawer', 'unknown'],
    default: 'unknown'
  },

  // Admin user who made the change (null for system/cron triggers)
  changed_by_email: { type: String, default: null },
  changed_by_id: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },

  // Was this a destructive change (images went from >0 to 0 or default)?
  is_destructive: { type: Boolean, default: false },

  // Notes — e.g. error message if images were wiped due to a bug
  notes: { type: String },

  // Request metadata for debugging
  request_ip: { type: String },
  request_user_agent: { type: String },

  created_at: { type: Date, default: Date.now }
});

// Indexes for fast querying
ImageUpdateLogSchema.index({ item_id: 1, created_at: -1 });
ImageUpdateLogSchema.index({ item_code: 1 });
ImageUpdateLogSchema.index({ triggered_by: 1 });
ImageUpdateLogSchema.index({ is_destructive: 1 });
ImageUpdateLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ImageUpdateLog', ImageUpdateLogSchema);
