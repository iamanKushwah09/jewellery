const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GmcSyncLogSchema = new Schema({
  itemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Item', 
    required: false, 
    index: true 
  },
  offerId: { 
    type: String, 
    index: true 
  },
  action: { 
    type: String, 
    enum: ['INSERT', 'UPDATE', 'DELETE', 'PATCH_PRICE', 'PATCH_INVENTORY', 'PATCH_IMAGE', 'BATCH_SYNC', 'RECONCILE'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'RETRYING'], 
    required: true,
    index: true
  },
  attempts: { 
    type: Number, 
    default: 1 
  },
  requestId: { 
    type: String 
  },
  payload: { 
    type: Schema.Types.Mixed 
  },
  response: { 
    type: Schema.Types.Mixed 
  },
  error: { 
    type: String 
  },
  errorCode: { 
    type: String,
    enum: [
      'TEMPORARY_ERROR', 
      'RATE_LIMIT', 
      'AUTH_ERROR', 
      'VALIDATION_ERROR', 
      'IMAGE_ERROR', 
      'PRODUCT_DATA_ERROR', 
      'PERMISSION_ERROR', 
      'UNKNOWN_ERROR'
    ],
    default: 'UNKNOWN_ERROR'
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

GmcSyncLogSchema.index({ createdAt: -1 });
GmcSyncLogSchema.index({ itemId: 1, createdAt: -1 });
GmcSyncLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('GmcSyncLog', GmcSyncLogSchema);
