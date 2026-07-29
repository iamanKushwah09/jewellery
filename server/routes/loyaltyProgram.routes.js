const express = require('express');
const router = express.Router();
const loyaltyProgramController = require('../controller/loyaltyProgram.controller');

// Config routes
router.get('/config', loyaltyProgramController.getConfig);
router.post('/config', loyaltyProgramController.updateConfig);

// Tier routes
router.get('/tiers', loyaltyProgramController.getTiers);
router.post('/tiers', loyaltyProgramController.createTier);
router.put('/tiers/:id', loyaltyProgramController.updateTier);
router.delete('/tiers/:id', loyaltyProgramController.deleteTier);
router.post('/assign-tier', loyaltyProgramController.assignTierToCustomer);
router.post('/create-membership-order', loyaltyProgramController.createMembershipOrder);
router.post('/purchase-membership', loyaltyProgramController.purchaseMembership);
router.get('/my-membership/:customerId', loyaltyProgramController.getMyMembership);

// Item Group Rules
router.get('/item-group-rules', loyaltyProgramController.getItemGroupRules);
router.post('/item-group-rules', loyaltyProgramController.createItemGroupRule);
router.put('/item-group-rules/:id', loyaltyProgramController.updateItemGroupRule);
router.delete('/item-group-rules/:id', loyaltyProgramController.deleteItemGroupRule);

// Item Rules
router.get('/item-rules', loyaltyProgramController.getItemRules);
router.post('/item-rules', loyaltyProgramController.createItemRule);
router.put('/item-rules/:id', loyaltyProgramController.updateItemRule);
router.delete('/item-rules/:id', loyaltyProgramController.deleteItemRule);

// Sale Rules
router.get('/sale-rules', loyaltyProgramController.getSaleRules);
router.post('/sale-rules', loyaltyProgramController.createSaleRule);
router.put('/sale-rules/:id', loyaltyProgramController.updateSaleRule);
router.delete('/sale-rules/:id', loyaltyProgramController.deleteSaleRule);

// Visit Rules
router.get('/visit-rules', loyaltyProgramController.getVisitRules);
router.post('/visit-rules', loyaltyProgramController.createVisitRule);
router.put('/visit-rules/:id', loyaltyProgramController.updateVisitRule);
router.delete('/visit-rules/:id', loyaltyProgramController.deleteVisitRule);

// Lumpsum Rules
router.get('/lumpsum-rules', loyaltyProgramController.getLumpsumRules);
router.post('/lumpsum-rules', loyaltyProgramController.createLumpsumRule);
router.put('/lumpsum-rules/:id', loyaltyProgramController.updateLumpsumRule);
router.delete('/lumpsum-rules/:id', loyaltyProgramController.deleteLumpsumRule);

// Coupon Templates (admin-configured)
router.get('/coupon-templates', loyaltyProgramController.getCouponTemplates);
router.post('/coupon-templates', loyaltyProgramController.createCouponTemplate);
router.put('/coupon-templates/:id', loyaltyProgramController.updateCouponTemplate);
router.delete('/coupon-templates/:id', loyaltyProgramController.deleteCouponTemplate);

// Legacy coupon routes (kept for admin backward compat)
router.get('/coupons', loyaltyProgramController.getCoupons);
router.post('/coupons', loyaltyProgramController.createCoupon);
router.put('/coupons/:id', loyaltyProgramController.updateCoupon);
router.delete('/coupons/:id', loyaltyProgramController.deleteCoupon);

// Calculation & Redemption
router.post('/calculate-points', loyaltyProgramController.calculatePoints);
router.post('/redeem-points', loyaltyProgramController.redeemPoints);

// Customer facing
router.get('/points-balance/:customerId', loyaltyProgramController.getPointsBalance);
router.get('/customer-coupons/:customerId', loyaltyProgramController.getCustomerCoupons);
router.get('/all-issued-coupons', loyaltyProgramController.getAllIssuedCoupons);
router.post('/validate-coupon', loyaltyProgramController.validateCoupon);

module.exports = router;

