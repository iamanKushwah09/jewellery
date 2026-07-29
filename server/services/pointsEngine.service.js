/**
 * PointsEngine — Evaluates all matching point rules for an invoice and returns
 * a single winning rule's points (or additive sum based on config).
 *
 * Priority Order (default, editable in global_settings):
 *   item > item_group > sale_slab > visit_slab > lumpsum
 *
 * Engine also respects:
 *  - Membership tier gating on slabs (tier-specific → fallback to common)
 *  - Per-tier and global max points cap
 */

const LoyaltyConfig = require('../models/loyaltyConfig.model');
const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
const LoyaltyItemRule = require('../models/loyaltyItemRule.model');
const LoyaltyItemGroupRule = require('../models/loyaltyItemGroupRule.model');
const LoyaltySaleRule = require('../models/loyaltySaleRule.model');
const LoyaltyVisitRule = require('../models/loyaltyVisitRule.model');
const LoyaltyLumpsumRule = require('../models/loyaltyLumpsumRule.model');
const LoyaltyLedger = require('../models/loyaltyLedger.model');
const Customer = require('../models/customer.model');

const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────
// HEL-PER — evaluate a single ITEM rule
// ──────────────────────────────────────────────────────────
function calcItemPoints(rule, itemTotal) {
  if (rule.calcType === 'percentage') {
    return (itemTotal * rule.pointsValue) / 100;
  }
  return rule.pointsValue;
}

// ──────────────────────────────────────────────────────────
// HEL-PER — apply global/tier points cap
// ──────────────────────────────────────────────────────────
function applyPointsCap(rawPoints, globalCap, tierCap) {
  const cap = tierCap != null ? tierCap : globalCap;
  if (!cap || cap <= 0) return rawPoints;
  return Math.min(rawPoints, cap);
}

// ──────────────────────────────────────────────────────────
// STRATEGY A — Item Wise
// Returns highest-points item rule match across all order items
// ──────────────────────────────────────────────────────────
async function evaluateItemWise(items) {
  let totalPoints = 0;
  let expireDays = null;

  for (const orderItem of items) {
    if (!orderItem.item_id || !mongoose.Types.ObjectId.isValid(orderItem.item_id)) continue;
    const rules = await LoyaltyItemRule.find({
      $or: [
        { isAllItems: true },
        { itemIds: orderItem.item_id },
        { itemId: orderItem.item_id }
      ]
    });
    
    if (rules.length > 0) {
      let maxPointsForItem = 0;
      let chosenRule = null;
      for (const rule of rules) {
        const itemTotal = (orderItem.price || 0) * (orderItem.quantity || 1);
        const pts = calcItemPoints(rule, itemTotal);
        if (pts > maxPointsForItem) {
          maxPointsForItem = pts;
          chosenRule = rule;
        }
      }
      if (chosenRule) {
        totalPoints += maxPointsForItem;
        if (chosenRule.expDays && (expireDays === null || chosenRule.expDays < expireDays)) {
          expireDays = chosenRule.expDays;
        }
      }
    }
  }
  return totalPoints > 0 ? { points: totalPoints, expireDays, sourceType: 'point' } : null;
}

// ──────────────────────────────────────────────────────────
// STRATEGY B — Item Group Wise
// ──────────────────────────────────────────────────────────
async function evaluateItemGroupWise(items) {
  let totalPoints = 0;
  let expireDays = null;

  for (const orderItem of items) {
    if (!orderItem.item_group_id || !mongoose.Types.ObjectId.isValid(orderItem.item_group_id)) continue;
    const rules = await LoyaltyItemGroupRule.find({
      $or: [
        { isAllItemGroups: true },
        { itemGroupIds: orderItem.item_group_id },
        { itemGroupId: orderItem.item_group_id }
      ]
    });

    if (rules.length > 0) {
      let maxPointsForGroup = 0;
      let chosenRule = null;
      for (const rule of rules) {
        const itemTotal = (orderItem.price || 0) * (orderItem.quantity || 1);
        const pts = calcItemPoints(rule, itemTotal);
        if (pts > maxPointsForGroup) {
          maxPointsForGroup = pts;
          chosenRule = rule;
        }
      }
      if (chosenRule) {
        totalPoints += maxPointsForGroup;
        if (chosenRule.expDays && (expireDays === null || chosenRule.expDays < expireDays)) {
          expireDays = chosenRule.expDays;
        }
      }
    }
  }
  return totalPoints > 0 ? { points: totalPoints, expireDays, sourceType: 'point' } : null;
}

// ──────────────────────────────────────────────────────────
// STRATEGY C — Sale Slab
// Tier-specific slab takes precedence over common (null membershipId) slab
// ──────────────────────────────────────────────────────────
async function evaluateSaleSlab(totalAmount, tierId) {
  // 1. Try tier-specific slab first
  let rule = null;
  if (tierId) {
    rule = await LoyaltySaleRule.findOne({
      membershipId: tierId,
      saleFrom: { $lte: totalAmount },
      saleTo: { $gte: totalAmount }
    });
  }
  // 2. Fallback to common slab
  if (!rule) {
    rule = await LoyaltySaleRule.findOne({
      membershipId: null,
      saleFrom: { $lte: totalAmount },
      saleTo: { $gte: totalAmount }
    });
  }

  if (!rule || !rule.discountValue) return null;

  // Sale slabs award a discount — convert to points equivalent
  let points = 0;
  if (rule.discountType === 'percentage') {
    points = (totalAmount * rule.discountValue) / 100;
  } else {
    points = rule.discountValue;
  }
  return { points, expireDays: 30, sourceType: 'sale', rule };
}

// ──────────────────────────────────────────────────────────
// STRATEGY D — Visit Slab
// ──────────────────────────────────────────────────────────
async function evaluateVisitSlab(visitCount, totalAmount, tierId) {
  let rule = null;
  if (tierId) {
    rule = await LoyaltyVisitRule.findOne({
      membershipId: tierId,
      visitFrom: { $lte: visitCount },
      visitTo: { $gte: visitCount },
      ...(totalAmount ? { saleFrom: { $lte: totalAmount }, saleTo: { $gte: totalAmount } } : {})
    });
  }
  if (!rule) {
    rule = await LoyaltyVisitRule.findOne({
      membershipId: null,
      visitFrom: { $lte: visitCount },
      visitTo: { $gte: visitCount },
      ...(totalAmount ? { saleFrom: { $lte: totalAmount }, saleTo: { $gte: totalAmount } } : {})
    });
  }

  if (!rule || !rule.discountValue) return null;

  let points = 0;
  if (rule.discountType === 'percentage') {
    points = (totalAmount * rule.discountValue) / 100;
  } else {
    points = rule.discountValue;
  }
  return { points, expireDays: rule.expireDays, sourceType: 'visit', rule };
}

// ──────────────────────────────────────────────────────────
// STRATEGY E — Lumpsum
// ──────────────────────────────────────────────────────────
async function evaluateLumpsum(totalAmount, tierId) {
  if (!tierId) return null;
  // Find the highest matching lumpsum threshold for this tier
  const rule = await LoyaltyLumpsumRule.findOne({
    membershipId: tierId,
    saleAmount: { $lte: totalAmount }
  }).sort({ saleAmount: -1 }); // highest threshold first

  if (!rule) return null;
  return { points: rule.points, expireDays: rule.expireDays, sourceType: 'lumpsum' };
}

// ──────────────────────────────────────────────────────────
// POINTS ENGINE — Main entry point
// ──────────────────────────────────────────────────────────
const PointsEngine = {
  /**
   * Evaluate points to award for a given invoice.
   * @param {Object} params - { customerId, items, totalAmount, invoiceId }
   * @returns {Object} { pointsAwarded, expireDays, sourceType, ledgerEntry }
   */
  evaluate: async ({ customerId, items = [], totalAmount, invoiceId, commit = true }) => {
    const config = await LoyaltyConfig.findOne();
    if (!config) return { pointsAwarded: 0 };

    const customer = await Customer.findById(customerId).populate('loyaltyTier');
    if (!customer) return { pointsAwarded: 0 };

    const tierId = customer.loyaltyTier?._id || null;
    const visitCount = (customer.visitCount || 0) + 1; // current order = new visit
    const enabledModes = config.enabledModes || {};

    // ── Evaluate each applicable strategy ──
    const candidateMap = {};

    if (enabledModes.pointWise !== false) {
      const itemResult = await evaluateItemWise(items);
      if (itemResult) candidateMap['item'] = itemResult;

      const groupResult = await evaluateItemGroupWise(items);
      if (groupResult) candidateMap['item_group'] = groupResult;
    }

    if (enabledModes.saleWise !== false) {
      const saleResult = await evaluateSaleSlab(totalAmount, tierId);
      if (saleResult) candidateMap['sale_slab'] = saleResult;
    }

    if (enabledModes.visitWise !== false) {
      const visitResult = await evaluateVisitSlab(visitCount, totalAmount, tierId);
      if (visitResult) candidateMap['visit_slab'] = visitResult;
    }

    if (enabledModes.lumpsum !== false) {
      const lumpsumResult = await evaluateLumpsum(totalAmount, tierId);
      if (lumpsumResult) candidateMap['lumpsum'] = lumpsumResult;
    }

    if (Object.keys(candidateMap).length === 0) return { pointsAwarded: 0 };

    // ── Pick winner based on mode ──
    let rawPoints = 0;
    let expireDays = config.defaultExpireDays || 90;
    let sourceType = 'sale';

    const priorityOrder = config.rulePriorityOrder || ['item', 'item_group', 'sale_slab', 'visit_slab', 'lumpsum'];

    if (config.pointsMode === 'additive') {
      // Sum all matched rules
      rawPoints = Object.values(candidateMap).reduce((sum, r) => sum + r.points, 0);
      // Use shortest expiry
      const allExpiries = Object.values(candidateMap).map(r => r.expireDays).filter(Boolean);
      if (allExpiries.length) expireDays = Math.min(...allExpiries);
      sourceType = 'sale'; // mixed
    } else {
      // Priority mode — pick first match per priority order
      for (const ruleType of priorityOrder) {
        if (candidateMap[ruleType]) {
          rawPoints = candidateMap[ruleType].points;
          expireDays = candidateMap[ruleType].expireDays || expireDays;
          sourceType = candidateMap[ruleType].sourceType;
          break;
        }
      }
    }

    // ── Apply cap ──
    const tierCap = customer.loyaltyTier?.maxPointsPerInvoice ?? null;
    const globalCap = config.maxPointsPerInvoice ?? null;
    const finalPoints = Math.round(applyPointsCap(rawPoints, globalCap, tierCap));

    if (finalPoints <= 0) return { pointsAwarded: 0 };

    // ── Write to ledger if commit is true ──
    let ledgerEntry = null;
    if (commit) {
      const expiryDate = expireDays ? new Date(Date.now() + expireDays * 86400000) : null;
      ledgerEntry = await LoyaltyLedger.create({
        customerId,
        sourceType,
        pointsEarned: finalPoints,
        pointsRedeemed: 0,
        earnedDate: new Date(),
        expiryDate,
        invoiceId: invoiceId || null
      });

      // ── Increment customer visit count ──
      await Customer.findByIdAndUpdate(customerId, { $inc: { visitCount: 1 } });
    }

    return { pointsAwarded: finalPoints, expireDays, sourceType, ledgerEntry };
  }
};

module.exports = PointsEngine;
