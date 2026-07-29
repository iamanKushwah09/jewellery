const mongoose = require('mongoose');

const loyaltyItemRuleSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: false },
  itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  isAllItems: { type: Boolean, default: false },
  calcType: { type: String, enum: ['percentage', 'fixed'], required: true },
  pointsValue: { type: Number, required: true },
  expDays: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyItemRule', loyaltyItemRuleSchema);
