const LoyaltyConfig = require('../models/loyaltyConfig.model');
const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
const LoyaltyItemRule = require('../models/loyaltyItemRule.model');
const LoyaltySaleRule = require('../models/loyaltySaleRule.model');
const LoyaltyVisitRule = require('../models/loyaltyVisitRule.model');
const { LoyaltyCouponTemplate, LoyaltyIssuedCoupon } = require('../models/loyaltyCoupon.model');
const LoyaltyLedger = require('../models/loyaltyLedger.model');
const PointsEngine = require('../services/pointsEngine.service');
const CouponGiftEngine = require('../services/couponGiftEngine.service');
const Customer = require('../models/customer.model');

// Config
exports.getConfig = async (req, res) => {
  try {
    const config = await LoyaltyConfig.findOne();
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    let config = await LoyaltyConfig.findOne();
    if (!config) {
      config = new LoyaltyConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    await config.save();
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Membership Tiers
exports.getTiers = async (req, res) => {
  try {
    const tiers = await LoyaltyMembershipTier.find();
    res.status(200).json({ success: true, data: tiers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTier = async (req, res) => {
  try {
    const tier = new LoyaltyMembershipTier(req.body);
    await tier.save();
    res.status(201).json({ success: true, data: tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTier = async (req, res) => {
  try {
    await LoyaltyMembershipTier.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTier = async (req, res) => {
  try {
    const tier = await LoyaltyMembershipTier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found' });
    res.status(200).json({ success: true, data: tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTierToCustomer = async (req, res) => {
  try {
    const { customerId, tierId } = req.body;
    const Customer = require('../models/customer.model');
    
    if (!tierId) {
      // Remove tier if no tierId is provided
      await Customer.findByIdAndUpdate(customerId, { 
        loyaltyTier: null,
        loyaltyTierExpiry: null
      });
      return res.status(200).json({ success: true, message: "Tier removed successfully" });
    }

    const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
    
    const tier = await LoyaltyMembershipTier.findById(tierId);
    if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });

    // Calculate expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + tier.validityDays);

    await Customer.findByIdAndUpdate(customerId, { 
      loyaltyTier: tierId,
      loyaltyTierExpiry: expiry
    });
    res.status(200).json({ success: true, message: "Tier assigned successfully", expiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMembershipOrder = async (req, res) => {
  try {
    const { tierId } = req.body;
    const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
    const Razorpay = require('razorpay');

    const tier = await LoyaltyMembershipTier.findById(tierId);
    if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });

    if (tier.purchasePrice <= 0) {
      return res.status(400).json({ success: false, message: "This tier is not purchasable" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: tier.purchasePrice * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_tier_${tier._id}`
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");

    res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.purchaseMembership = async (req, res) => {
  try {
    const { customerId, tierId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const Customer = require('../models/customer.model');
    const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
    const crypto = require('crypto');

    // Cryptographic validation of payment
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment verification failed! Transaction not legit." });
    }

    const tier = await LoyaltyMembershipTier.findById(tierId);
    if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + tier.validityDays);

    await Customer.findByIdAndUpdate(customerId, {
      loyaltyTier: tierId,
      loyaltyTierExpiry: expiry
    });

    res.status(200).json({ success: true, message: "Membership purchased successfully", tier: tier.name, expiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyMembership = async (req, res) => {
  try {
    const { customerId } = req.params;
    const Customer = require('../models/customer.model');
    const customer = await Customer.findById(customerId)
      .populate('loyaltyTier')
      .select('loyaltyTier loyaltyTierExpiry name');

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const now = new Date();
    const isExpired = customer.loyaltyTierExpiry && new Date(customer.loyaltyTierExpiry) < now;

    res.status(200).json({
      success: true,
      data: {
        tier: isExpired ? null : customer.loyaltyTier,
        expiry: customer.loyaltyTierExpiry,
        isExpired,
        isActive: !!customer.loyaltyTier && !isExpired
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Item Rules
exports.getItemRules = async (req, res) => {
  try {
    const rules = await LoyaltyItemRule.find().populate('itemId').populate('itemIds');
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createItemRule = async (req, res) => {
  try {
    const rule = new LoyaltyItemRule(req.body);
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sale Rules
exports.getSaleRules = async (req, res) => {
  try {
    const rules = await LoyaltySaleRule.find().populate('giftItem');
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSaleRule = async (req, res) => {
  try {
    const rule = new LoyaltySaleRule(req.body);
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Visit Rules
exports.getVisitRules = async (req, res) => {
  try {
    const rules = await LoyaltyVisitRule.find();
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createVisitRule = async (req, res) => {
  try {
    const rule = new LoyaltyVisitRule(req.body);
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Coupons
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await LoyaltyCoupon.find().populate('targetId');
    res.status(200).json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = new LoyaltyCoupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// NEW CRUD CONTROLLERS
// ==========================================

// Item Group Rules
exports.getItemGroupRules = async (req, res) => {
  try {
    const rules = await require('../models/loyaltyItemGroupRule.model').find().populate('itemGroupId').populate('itemGroupIds');
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.createItemGroupRule = async (req, res) => {
  try {
    const rule = await require('../models/loyaltyItemGroupRule.model').create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.updateItemGroupRule = async (req, res) => {
  try {
    const rule = await require('../models/loyaltyItemGroupRule.model').findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteItemGroupRule = async (req, res) => {
  try {
    await require('../models/loyaltyItemGroupRule.model').findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Item Rules Update/Delete
exports.updateItemRule = async (req, res) => {
  try {
    const rule = await LoyaltyItemRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteItemRule = async (req, res) => {
  try {
    await LoyaltyItemRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sale Rules Update/Delete
exports.updateSaleRule = async (req, res) => {
  try {
    const rule = await LoyaltySaleRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteSaleRule = async (req, res) => {
  try {
    await LoyaltySaleRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Visit Rules Update/Delete
exports.updateVisitRule = async (req, res) => {
  try {
    const rule = await LoyaltyVisitRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteVisitRule = async (req, res) => {
  try {
    await LoyaltyVisitRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lumpsum Rules
exports.getLumpsumRules = async (req, res) => {
  try {
    const rules = await require('../models/loyaltyLumpsumRule.model').find().populate('membershipId');
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.createLumpsumRule = async (req, res) => {
  try {
    const rule = await require('../models/loyaltyLumpsumRule.model').create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.updateLumpsumRule = async (req, res) => {
  try {
    const rule = await require('../models/loyaltyLumpsumRule.model').findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteLumpsumRule = async (req, res) => {
  try {
    await require('../models/loyaltyLumpsumRule.model').findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Coupons Update/Delete
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await LoyaltyCoupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteCoupon = async (req, res) => {
  try {
    await LoyaltyCoupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// CALCULATION & REDEMPTION (REAL ENGINES)
// ==========================================

exports.calculatePoints = async (req, res) => {
  try {
    const { customerId, items, totalAmount, invoiceId } = req.body;
    if (!customerId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'customerId and totalAmount are required' });
    }

    // Run both engines independently with commit: false for preview/simulation
    const [pointsResult, couponResult] = await Promise.all([
      PointsEngine.evaluate({ customerId, items, totalAmount, invoiceId, commit: false }),
      CouponGiftEngine.evaluate({ customerId, items, totalAmount, invoiceId, commit: false })
    ]);

    res.status(200).json({
      success: true,
      pointsAwarded: pointsResult.pointsAwarded,
      sourceType: pointsResult.sourceType,
      expireDays: pointsResult.expireDays,
      couponsIssued: couponResult.couponsIssued,
      giftsIssued: couponResult.giftsIssued
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.redeemPoints = async (req, res) => {
  try {
    const { customerId, pointsToRedeem, invoiceAmount } = req.body;

    const config = await LoyaltyConfig.findOne();
    if (!config) return res.status(500).json({ success: false, message: 'Loyalty config not found' });

    // Validate minimums
    if (invoiceAmount < config.minInvoiceAmountToRedeem) {
      return res.status(400).json({ success: false, message: `Minimum invoice amount to redeem is ₹${config.minInvoiceAmountToRedeem}` });
    }
    if (pointsToRedeem < config.minPointToRedeem) {
      return res.status(400).json({ success: false, message: `Minimum points to redeem is ${config.minPointToRedeem}` });
    }

    // Check customer has sufficient unexpired points
    const now = new Date();
    const ledgerEntries = await LoyaltyLedger.find({
      customerId,
      isExpired: false,
      pointsEarned: { $gt: 0 },
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
    });

    const availablePoints = ledgerEntries.reduce((sum, e) => sum + (e.pointsEarned - e.pointsRedeemed), 0);
    if (availablePoints < pointsToRedeem) {
      return res.status(400).json({ success: false, message: `Insufficient points. Available: ${availablePoints}` });
    }

    // Deduct points from ledger (FIFO: oldest first)
    let remaining = pointsToRedeem;
    for (const entry of ledgerEntries.sort((a, b) => a.earnedDate - b.earnedDate)) {
      if (remaining <= 0) break;
      const available = entry.pointsEarned - entry.pointsRedeemed;
      const deduct = Math.min(available, remaining);
      entry.pointsRedeemed += deduct;
      remaining -= deduct;
      await entry.save();
    }

    // Synchronize deduction with the legacy LoyaltyPoint collection
    try {
      const LoyaltyPoint = require('../models/loyaltyPoint.model');
      let loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId });
      if (loyaltyRecord) {
        loyaltyRecord.totalPoints = Math.max(0, loyaltyRecord.totalPoints - pointsToRedeem);
        loyaltyRecord.transactions.push({
          pointsRedeemed: pointsToRedeem,
          description: 'Redeemed points'
        });
        await loyaltyRecord.save();
      }
    } catch (syncErr) {
      console.error('Error syncing redemption with legacy LoyaltyPoint model:', syncErr);
    }

    const valueDiscounted = Math.round(pointsToRedeem * config.pointValueInRs * 100) / 100;

    res.status(200).json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      valueDiscounted,
      redeemLevel: config.redeemLevel,
      message: `Redeemed ${pointsToRedeem} points for ₹${valueDiscounted} discount`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Customer points balance
exports.getPointsBalance = async (req, res) => {
  try {
    const { customerId } = req.params;
    const now = new Date();
    const entries = await LoyaltyLedger.find({
      customerId,
      isExpired: false,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
    }).sort({ earnedDate: -1 });

    const ledgerBalance = entries.reduce((sum, entry) => sum + ((entry.pointsEarned || 0) - (entry.pointsRedeemed || 0)), 0);

    const LoyaltyPoint = require('../models/loyaltyPoint.model');
    const legacyPoint = await LoyaltyPoint.findOne({ customer: customerId });
    const legacyBalance = legacyPoint ? legacyPoint.totalPoints : 0;

    const balance = Math.max(ledgerBalance, legacyBalance);

    res.status(200).json({ success: true, balance, entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Validate a coupon code
exports.validateCoupon = async (req, res) => {
  try {
    const result = await CouponGiftEngine.validateCoupon(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get customer's issued coupons
exports.getCustomerCoupons = async (req, res) => {
  try {
    const { customerId } = req.params;
    const coupons = await LoyaltyIssuedCoupon.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all issued coupons for admin
exports.getAllIssuedCoupons = async (req, res) => {
  try {
    const coupons = await LoyaltyIssuedCoupon.find()
      .populate('customerId', 'name mobile email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get admin coupon templates
exports.getCouponTemplates = async (req, res) => {
  try {
    const templates = await LoyaltyCouponTemplate.find();
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCouponTemplate = async (req, res) => {
  try {
    const template = await LoyaltyCouponTemplate.create(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCouponTemplate = async (req, res) => {
  try {
    const template = await LoyaltyCouponTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCouponTemplate = async (req, res) => {
  try {
    await LoyaltyCouponTemplate.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
