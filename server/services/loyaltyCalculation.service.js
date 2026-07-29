const LoyaltyConfig = require('../models/loyaltyConfig.model');
const LoyaltyMembershipTier = require('../models/loyaltyMembershipTier.model');
const LoyaltyItemRule = require('../models/loyaltyItemRule.model');
const LoyaltySaleRule = require('../models/loyaltySaleRule.model');
const LoyaltyVisitRule = require('../models/loyaltyVisitRule.model');
const Customer = require('../models/customer.model');

const LoyaltyCalculationService = {
  /**
   * Calculate points and discounts for an incoming order based on complex loyalty rules.
   * @param {Object} customerId - The customer's ObjectId
   * @param {Array} items - Array of { item_id, item_group_id, price, quantity }
   * @param {Number} totalAmount - Total amount before discount
   */
  calculateOrderLoyalty: async (customerId, items, totalAmount) => {
    let finalPointsEarned = 0;
    let applicableDiscounts = []; // Array of discount objects
    let freeGifts = [];
    let freeCoupons = [];
    
    // 1. Fetch Master Config
    const config = await LoyaltyConfig.findOne();
    if (!config) return { points: 0, discounts: [] }; // No config, no points

    // 2. Fetch Customer Info
    const customer = await Customer.findById(customerId).populate('loyaltyTier');
    const visitCount = customer ? (customer.visitCount || 0) + 1 : 1; // Current order is a new visit

    // 3. Process Visit Wise Rules First
    const visitRules = await LoyaltyVisitRule.find({ visitCount: visitCount });
    for (const rule of visitRules) {
      if (!rule.saleFrom || (totalAmount >= rule.saleFrom && totalAmount <= rule.saleTo)) {
        if (rule.rewardPoints) finalPointsEarned += rule.rewardPoints;
        if (rule.discountValue) {
           applicableDiscounts.push({
             type: 'visit_wise',
             discountType: rule.discountType,
             value: rule.discountValue
           });
        }
        if (rule.freeCouponsAmount) freeCoupons.push({ type: 'visit_wise', amount: rule.freeCouponsAmount });
      }
    }

    // 4. Process Sale Wise Rules
    const saleRules = await LoyaltySaleRule.find({
      saleFrom: { $lte: totalAmount },
      saleTo: { $gte: totalAmount }
    });
    for (const rule of saleRules) {
      if (rule.discountValue) {
        applicableDiscounts.push({
          type: 'sale_wise',
          discountType: rule.discountType,
          value: rule.discountValue
        });
      }
      if (rule.giftConditionAmount && totalAmount > rule.giftConditionAmount) {
        freeGifts.push(rule.giftItem);
      }
      if (rule.freeCouponsAmount) freeCoupons.push({ type: 'sale_wise', amount: rule.freeCouponsAmount });
    }

    // 5. Process Item & Group Wise + Membership Slabs
    // Logic: Item specific points take precedence over membership slabs, unless membership is strictly additive.
    // Assuming Membership slabs apply to the whole bill, and item points are extra.
    
    // Membership Slabs & Lumpsum
    if (customer && customer.loyaltyTier) {
      const tier = customer.loyaltyTier;
      // Check lumpsum
      for (const lumpsum of tier.lumpsumRules) {
        if (totalAmount >= lumpsum.saleAmount) {
           // We might just take the highest applicable one
           finalPointsEarned += lumpsum.points; 
           break; // Usually lumpsum applies once per threshold
        }
      }
      
      // Check slab rule
      for (const slab of tier.slabRules) {
         if (totalAmount >= slab.saleStart && totalAmount <= slab.saleEnd) {
            if (slab.pointType === 'percentage') {
               finalPointsEarned += (totalAmount * (slab.value / 100));
            } else {
               finalPointsEarned += slab.value;
            }
            break; // Apply one matching slab
         }
      }
    }

    // Item Wise Point calculation
    const LoyaltyItemGroupRule = require('../models/loyaltyItemGroupRule.model');

    for (const orderItem of items) {
      // Find rule for this specific item
      const itemRule = await LoyaltyItemRule.findOne({ itemId: orderItem.item_id || orderItem.itemId });
      if (itemRule) {
         const itemTotal = orderItem.price * orderItem.quantity;
         if (itemRule.calcType === 'percentage') {
             finalPointsEarned += (itemTotal * (itemRule.pointsValue / 100));
         } else {
             finalPointsEarned += itemRule.pointsValue * orderItem.quantity; // Fixed points usually apply per unit in items
         }
      } else {
         // Fallback to Group Wise
         if (orderItem.item_group_id || orderItem.groupId) {
           const groupRule = await LoyaltyItemGroupRule.findOne({ itemGroupId: orderItem.item_group_id || orderItem.groupId });
           if (groupRule) {
              const itemTotal = orderItem.price * orderItem.quantity;
              if (groupRule.calcType === 'percentage') {
                  finalPointsEarned += (itemTotal * (groupRule.pointsValue / 100));
              } else {
                  finalPointsEarned += groupRule.pointsValue * orderItem.quantity;
              }
           }
         }
      }
    }

    // Apply Friction / Config Constraints
    // Config: Point 1 to equal to 0.80 Rs (Used during REDEMPTION, not earning)
    
    return {
      pointsEarned: Math.round(finalPointsEarned),
      discounts: applicableDiscounts,
      gifts: freeGifts,
      coupons: freeCoupons,
      config: config
    };
  }
};

module.exports = LoyaltyCalculationService;
