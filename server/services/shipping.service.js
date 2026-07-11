const ShippingSetting = require('../models/shippingSetting.model');
const PharmacySetting = require('../models/pharmacySetting.model');
const ShippingRule = require('../models/shippingRule.model');
const { getDrivingDistance } = require('./googleMaps.service');

const calculateShipping = async (customerLatitude, customerLongitude, orderAmount) => {
  try {
    // 1. Get active shipping strategy
    let setting = await ShippingSetting.findOne();
    if (!setting) {
      setting = { shippingStrategy: 'both' }; // default
    }
    const strategy = setting.shippingStrategy;

    // 2. Get pharmacy coordinates
    const pharmacy = await PharmacySetting.findOne();
    if (!pharmacy) {
      throw new Error('Pharmacy location is not configured.');
    }

    let distanceKm = 0;

    // 3. Calculate road distance (if strategy requires distance)
    if (strategy === 'distance' || strategy === 'both') {
      distanceKm = await getDrivingDistance(
        { latitude: pharmacy.officeLatitude, longitude: pharmacy.officeLongitude },
        { latitude: customerLatitude, longitude: customerLongitude }
      );
    }

    // 4. Fetch active rules
    const rules = await ShippingRule.find({ status: { $ne: 'inactive' } });

    if (!rules || rules.length === 0) {
      throw new Error('No active shipping rules found.');
    }

    // 5. Find matching rule
    let matchedRule = null;

    for (const rule of rules) {
      let isMatch = false;

      if (rule.ruleType === 'distance' && (strategy === 'distance' || strategy === 'both')) {
        if (distanceKm >= rule.startKm && distanceKm <= rule.endKm) {
          isMatch = true;
        }
      } else if ((rule.ruleType === 'order' || rule.ruleType === 'orderPrice') && (strategy === 'order' || strategy === 'both')) {
        if (orderAmount >= rule.startOrderPrice && orderAmount <= rule.endOrderPrice) {
          isMatch = true;
        }
      } else if (rule.ruleType === 'both' && strategy === 'both') {
        if (
          distanceKm >= rule.startKm &&
          distanceKm <= rule.endKm &&
          orderAmount >= rule.startOrderPrice &&
          orderAmount <= rule.endOrderPrice
        ) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      throw new Error('No shipping rule matches the given distance or order amount.');
    }

    // 6. Calculate shipping
    const shippingCharge = matchedRule.shippingCharge;
    const grandTotal = orderAmount + shippingCharge;

    // 7. Return response
    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      shippingCharge,
      shippingStrategy: strategy,
      matchedRule,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  calculateShipping
};
