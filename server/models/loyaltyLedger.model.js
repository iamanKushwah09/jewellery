const mongoose = require('mongoose');

const loyaltyLedgerSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  sourceType: { type: String, enum: ['point', 'sale', 'visit', 'lumpsum', 'redemption'], required: true },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  earnedDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleOrder' }, // Assuming SaleOrder is the invoice model
  isExpired: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
