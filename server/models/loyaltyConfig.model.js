const mongoose = require('mongoose');

const loyaltyConfigSchema = new mongoose.Schema({
  pointValueInRs: { type: Number, default: 0.80 },
  considerGST: { type: Boolean, default: true },
  pointCalculationOn: { type: String, enum: ['current_invoice', 'sale_invoice'], default: 'current_invoice' },
  considerDiscountItems: { type: Boolean, default: false },
  minInvoiceAmountToRedeem: { type: Number, default: 0 },
  minPointToRedeem: { type: Number, default: 0 },
  requireOTPForRedemption: { type: Boolean, default: false },
  redeemLevel: { type: String, enum: ['item_level', 'bill_level', 'sundry_level'], default: 'bill_level' },

  // Rule engine behavior (points_mode: priority = single winner | additive = all rules sum)
  pointsMode: { type: String, enum: ['priority', 'additive'], default: 'priority' },

  // Ordered list of rule types — higher index = lower priority (index 0 = highest)
  rulePriorityOrder: {
    type: [String],
    enum: ['item', 'item_group', 'sale_slab', 'visit_slab', 'lumpsum'],
    default: ['item', 'item_group', 'sale_slab', 'visit_slab', 'lumpsum']
  },

  // Global max points cap per invoice (0 or null = no cap)
  maxPointsPerInvoice: { type: Number, default: null },

  // Enable / Disable earning modes
  enabledModes: {
    pointWise: { type: Boolean, default: true },
    saleWise: { type: Boolean, default: true },
    visitWise: { type: Boolean, default: true },
    lumpsum: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyConfig', loyaltyConfigSchema);
