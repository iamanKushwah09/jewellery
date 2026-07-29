const mongoose = require('mongoose');

// Schemas moved to their respective rule files

const loyaltyMembershipTierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. Silver, Gold, Diamond
  saleStart: { type: Number, default: 0 }, // lower bound of slab
  saleEnd: { type: Number, default: 0 }, // upper bound of slab
  pointType: { type: String, enum: ['percentage', 'value'], default: 'percentage' },
  pointValue: { type: Number, default: 0 },
  expireDays: { type: Number, default: 0 },
  perPointValue: { type: Number, default: 0.8 },
  maxPointsPerInvoice: { type: Number, default: null }, // Overrides global cap if set
  
  // Application Scope (What this membership's discount/points apply to)
  applicableOn: { type: String, enum: ['all', 'item_group', 'brand', 'item'], default: 'all' },
  applicableItemGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ItemGroup' }],
  applicableBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'brand' }],
  applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],

  // Legacy fields (kept for backward compatibility with current Admin UI until updated)
  purchasePrice: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  validityDays: { type: Number, default: 365 },
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyMembershipTier', loyaltyMembershipTierSchema);
