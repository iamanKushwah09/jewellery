const mongoose = require('mongoose');

const loyaltyVisitRuleSchema = new mongoose.Schema({
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyMembershipTier', default: null }, // null = common/all tiers
  visitFrom: { type: Number, required: true },
  visitTo: { type: Number, required: true },
  expireDays: { type: Number, required: true },
  saleFrom: { type: Number },
  saleTo: { type: Number },
  discountType: { type: String, enum: ['percentage', 'value'] },
  discountValue: { type: Number },
  freeCouponsAmount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyVisitRule', loyaltyVisitRuleSchema);
