const mongoose = require('mongoose');

const loyaltyItemGroupRuleSchema = new mongoose.Schema({
  itemGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemGroup', required: false },
  itemGroupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ItemGroup' }],
  isAllItemGroups: { type: Boolean, default: false },
  calcType: { type: String, enum: ['percentage', 'fixed'], required: true },
  pointsValue: { type: Number, required: true },
  expDays: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyItemGroupRule', loyaltyItemGroupRuleSchema);
