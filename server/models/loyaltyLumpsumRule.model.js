const mongoose = require('mongoose');

const loyaltyLumpsumRuleSchema = new mongoose.Schema({
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyMembershipTier', required: true },
  saleAmount: { type: Number, required: true },
  points: { type: Number, required: true },
  expireDays: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyLumpsumRule', loyaltyLumpsumRuleSchema);
