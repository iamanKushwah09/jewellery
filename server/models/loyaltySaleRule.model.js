const mongoose = require('mongoose');

const loyaltySaleRuleSchema = new mongoose.Schema({
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyMembershipTier', default: null }, // null = common/all tiers
  saleFrom: { type: Number, required: true },
  saleTo: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'value'] },
  discountValue: { type: Number },
  giftConditionAmount: { type: Number }, // "More sale gift item: Sale more 500"
  giftItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }, // The item they get
  freeCouponsAmount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltySaleRule', loyaltySaleRuleSchema);
