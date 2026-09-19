const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema(
  {
    voucherNo: {
      type: String,
      default: function () {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `SALE-${yyyy}${mm}${dd}-${random}`;
      }
    },
    saleType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaleType',
      required: true
    },
    saleTypeCode: { type: String },
    matCentre: { type: String, default: 'Main Store' },
    date: { type: Date, required: true, default: Date.now },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    customerCode: { type: String },
    directCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DirectCustomer'
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salesman',
      required: true
    },
    salesmanCode: { type: String },
    items: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      name: { type: String },
      hsn: { type: String },
      image: { type: String },
      listPrice: { type: Number },
      price: { type: Number },
      quantity: { type: Number },
      unit: { type: String },
      conversion_factor: { type: Number },
      discount: { type: Number },
      totalDiscount: { type: Number },
      amount: { type: Number },
      color: { type: String },
      size: { type: String },
      description: {
        type: String,
        default: ''
      }
    }],
    netAmount: { type: Number },
    sundries: {
      SundriesDetail: [{
        Name: { type: String, required: true },
        DiscountAmount: { type: Number, default: 0 },
        DiscountPercent: { type: Number, default: 0 }
      }]
    },
    totalAmount: { type: Number },
    totalDiscountAmount: { type: Number },
    totalQuantity: { type: Number },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Cancelled"],
      default: 'Completed'
    },
    description: { type: String },
    busyApiStatus: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'FAILED' },
    isActive: {
      type: Boolean,
      default: true
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0
    },
    loyaltyDiscountAmount: {
      type: Number,
      default: 0
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
