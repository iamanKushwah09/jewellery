/**
 * CouponGiftEngine — SEPARATE from PointsEngine.
 * Evaluates ALL matching coupon/gift triggers for an invoice (additive).
 * A single invoice can trigger multiple coupon and gift rules simultaneously.
 *
 * Checks:
 *  1. Sale Slab — giftItem & freeCouponsAmount triggers
 *  2. Visit Slab — freeCouponsAmount triggers
 *  3. Item/Brand Coupon Templates — saleFrom/saleTo triggers
 */

const LoyaltySaleRule = require('../models/loyaltySaleRule.model');
const LoyaltyVisitRule = require('../models/loyaltyVisitRule.model');
const { LoyaltyCouponTemplate, LoyaltyIssuedCoupon } = require('../models/loyaltyCoupon.model');
const Customer = require('../models/customer.model');
const LoyaltyConfig = require('../models/loyaltyConfig.model');
const crypto = require('crypto');

// ──────────────────────────────────────────────────────────
// HELPER — generate a unique coupon code
// ──────────────────────────────────────────────────────────
function generateCouponCode(prefix = 'LYL') {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
}

// ──────────────────────────────────────────────────────────
// HELPER — issue a coupon to a customer from a trigger
// ──────────────────────────────────────────────────────────
async function issueCoupon({ customerId, invoiceId, couponValue, description, targetType, targetId, expiryDays, templateId }) {
  const couponCode = generateCouponCode();
  const expiryDate = new Date(Date.now() + (expiryDays || 30) * 86400000);

  return await LoyaltyIssuedCoupon.create({
    templateId: templateId || null,
    customerId,
    couponCode,
    description: description || `Loyalty Coupon — ₹${couponValue}`,
    couponValue,
    targetType: targetType || 'all',
    targetId: targetId || null,
    expiryDate,
    issuedFromInvoiceId: invoiceId || null,
  });
}

// ──────────────────────────────────────────────────────────
// COUPON GIFT ENGINE — Main entry point
// ──────────────────────────────────────────────────────────
const CouponGiftEngine = {
  /**
   * Evaluate and issue ALL coupons/gifts triggered by this invoice.
   * @param {Object} params - { customerId, items, totalAmount, invoiceId }
   * @returns {Object} { couponsIssued: [], giftsIssued: [] }
   */
  evaluate: async ({ customerId, items = [], totalAmount, invoiceId, commit = true }) => {
    const couponsIssued = [];
    const giftsIssued = [];

    const customer = await Customer.findById(customerId);
    if (!customer) return { couponsIssued, giftsIssued };

    const config = await LoyaltyConfig.findOne();
    const enabledModes = config?.enabledModes || {};

    const tierId = customer.loyaltyTier?._id || customer.loyaltyTier || null;
    const visitCount = (customer.visitCount || 0) + 1;
    const numTotal = Number(totalAmount) || 0;

    // ── 1. Sale Slab triggers (only if saleWise mode is enabled) ──
    if (enabledModes.saleWise !== false) {
      const saleRules = await LoyaltySaleRule.find({
        saleFrom: { $lte: numTotal },
        $or: [
          { saleTo: { $gte: numTotal } },
          { saleTo: 0 },
          { saleTo: null }
        ]
      });

      for (const rule of saleRules) {
        // Skip rules for a different tier (null = common, applies to all)
        if (rule.membershipId && String(rule.membershipId) !== String(tierId)) continue;

        // Gift Item trigger
        if (rule.giftItem && rule.giftConditionAmount && numTotal >= Number(rule.giftConditionAmount)) {
          giftsIssued.push({ itemId: rule.giftItem, source: 'sale_slab', invoiceAmount: numTotal });
        }

        // Free Coupon trigger
        const couponVal = Number(rule.freeCouponsAmount || 0);
        if (couponVal > 0) {
          if (commit) {
            const coupon = await issueCoupon({
              customerId,
              invoiceId,
              couponValue: couponVal,
              description: `Sale Coupon — Invoice ₹${numTotal}`,
              expiryDays: 30,
            });
            couponsIssued.push(coupon);
          } else {
            couponsIssued.push({
              couponValue: couponVal,
              description: `Sale Coupon — Invoice ₹${numTotal}`,
              expiryDays: 30,
              simulated: true,
            });
          }
        }
      }
    }

    // ── 2. Visit Slab triggers (only if visitWise mode is enabled) ──
    if (enabledModes.visitWise !== false) {
      const visitRules = await LoyaltyVisitRule.find({
        visitFrom: { $lte: visitCount },
        visitTo: { $gte: visitCount },
      });

      for (const rule of visitRules) {
        if (rule.membershipId && String(rule.membershipId) !== String(tierId)) continue;

        // Sale range filter (optional on visit rule)
        if (rule.saleFrom && rule.saleTo) {
          if (numTotal < rule.saleFrom || (rule.saleTo > 0 && numTotal > rule.saleTo)) continue;
        }

        const couponVal = Number(rule.freeCouponsAmount || 0);
        if (couponVal > 0) {
          if (commit) {
            const coupon = await issueCoupon({
              customerId,
              invoiceId,
              couponValue: couponVal,
              description: `Visit Coupon — Visit #${visitCount}`,
              expiryDays: rule.expireDays || 30,
            });
            couponsIssued.push(coupon);
          } else {
            couponsIssued.push({
              couponValue: couponVal,
              description: `Visit Coupon — Visit #${visitCount}`,
              expiryDays: rule.expireDays || 30,
              simulated: true,
            });
          }
        }
      }
    }

    // ── 3. Item / Brand coupon template triggers ──
    const couponTemplates = await LoyaltyCouponTemplate.find({
      saleFrom: { $lte: numTotal },
      $or: [
        { saleTo: { $gte: numTotal } },
        { saleTo: 0 },
        { saleTo: null }
      ]
    });

    for (const template of couponTemplates) {
      // If item or brand specific, check if any order item matches
      let matches = false;
      if (template.targetType === 'all') {
        matches = true;
      } else if (template.targetType === 'item') {
        matches = items.some(i => String(i.item_id) === String(template.targetId));
      } else if (template.targetType === 'brand') {
        matches = items.some(i => String(i.brand_id) === String(template.targetId));
      }

      if (matches) {
        if (commit) {
          const coupon = await issueCoupon({
            customerId,
            invoiceId,
            couponValue: template.couponValue,
            description: template.description || `Loyalty Coupon — ₹${template.couponValue}`,
            targetType: template.targetType,
            targetId: template.targetId,
            expiryDays: template.expiryDays || 30,
            templateId: template._id,
          });
          couponsIssued.push(coupon);
        } else {
          couponsIssued.push({
            couponValue: template.couponValue,
            description: template.description || `Loyalty Coupon — ₹${template.couponValue}`,
            targetType: template.targetType,
            targetId: template.targetId,
            expiryDays: template.expiryDays || 30,
            templateId: template._id,
            simulated: true,
          });
        }
      }
    }

    return { couponsIssued, giftsIssued };
  },

  /**
   * Validate a coupon code for a customer at checkout.
   * @returns {Object} { valid, coupon, reason }
   */
  validateCoupon: async ({ couponCode, customerId, totalAmount, items = [] }) => {
    if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
      return { valid: false, reason: 'Please enter a coupon code' };
    }
    const cleanCode = couponCode.trim();
    const query = {
      couponCode: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    };
    if (customerId) {
      query.$or = [{ customerId }, { customerId: null }];
    }

    const coupon = await LoyaltyIssuedCoupon.findOne(query);

    if (!coupon) return { valid: false, reason: 'Coupon not found or not assigned to this customer' };
    if (coupon.isUsed) return { valid: false, reason: 'Coupon has already been used' };
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, reason: 'Coupon has expired' };
    }

    // Check item restriction
    if (coupon.targetType === 'item' && coupon.targetId) {
      const itemMatch = (items || []).some(i => {
        const iId = String(i.item_id || i.itemId?.value || i.itemId || '');
        return iId === String(coupon.targetId);
      });
      if (!itemMatch) return { valid: false, reason: 'Coupon is not applicable on the items in cart' };
    }

    // Check brand restriction
    if (coupon.targetType === 'brand' && coupon.targetId) {
      const brandMatch = (items || []).some(i => {
        const bId = String(i.brand_id || i.brandId || i.brand || '');
        return bId === String(coupon.targetId);
      });
      if (!brandMatch) return { valid: false, reason: 'Coupon is not applicable on the brand in cart' };
    }

    return { valid: true, coupon };
  }
};

module.exports = CouponGiftEngine;
