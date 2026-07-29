const mongoose = require('mongoose');

// Master Coupon Template (configured by admin)
const loyaltyCouponTemplateSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['item', 'brand', 'all'], default: 'all' },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null }, // item or brand id
  saleFrom: { type: Number, default: 0 },
  saleTo: { type: Number, default: 0 },
  nextSaleIssueValue: { type: Number, default: 0 }, // value applicable on next purchase
  couponValue: { type: Number, required: true },
  description: { type: String },
  expiryDays: { type: Number, default: 30 }, // days from issuance
}, { timestamps: true });

// Issued Coupon (actual coupon issued to a specific customer)
const loyaltyIssuedCouponSchema = new mongoose.Schema({
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyCouponTemplate' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  couponCode: { type: String, required: true, unique: true },
  description: { type: String },
  couponValue: { type: Number, required: true },
  targetType: { type: String, enum: ['item', 'brand', 'all'], default: 'all' },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  expiryDate: { type: Date, required: true },
  issuedFromInvoiceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isUsed: { type: Boolean, default: false },
  usedOnInvoiceId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

module.exports = {
  LoyaltyCouponTemplate: mongoose.model('LoyaltyCouponTemplate', loyaltyCouponTemplateSchema),
  LoyaltyIssuedCoupon: mongoose.model('LoyaltyIssuedCoupon', loyaltyIssuedCouponSchema)
};
