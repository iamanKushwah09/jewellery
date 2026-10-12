const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  orderId: {
    type: String, // String to handle both SaleOrder (which has voucherNo or generic ID) and normal Order IDs
    required: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const loyaltyPointSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  transactions: [transactionSchema]
}, {
  timestamps: true
});

loyaltyPointSchema.index({ totalPoints: 1 });

module.exports = mongoose.model('LoyaltyPoint', loyaltyPointSchema);
