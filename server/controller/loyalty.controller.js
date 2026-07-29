const LoyaltyPoint = require('../models/loyaltyPoint.model');
const Customer = require('../models/customer.model');

// Get loyalty points for a specific customer
exports.getCustomerLoyaltyPoints = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId }).populate('customer', 'name email mobile');
    
    if (!loyaltyRecord) {
      return res.status(200).json({ customer: customerId, totalPoints: 0, transactions: [] });
    }
    
    res.status(200).json(loyaltyRecord);
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    res.status(500).json({ message: "Server error while fetching loyalty points", error: error.message });
  }
};

// Get all loyalty points (for Admin)
exports.getAllLoyaltyPoints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const loyaltyRecords = await LoyaltyPoint.find()
      .populate({
        path: 'customer',
        select: 'name email mobile group_type loyaltyTier loyaltyTierExpiry',
        populate: {
          path: 'loyaltyTier',
          model: 'LoyaltyMembershipTier',
          select: 'name discountPercentage purchasePrice validityDays'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoyaltyPoint.countDocuments();

    res.status(200).json({
      data: loyaltyRecords,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching all loyalty points:", error);
    res.status(500).json({ message: "Server error while fetching all loyalty points", error: error.message });
  }
};

// Add/Redeem points manually (optional, for admin use)
exports.adjustLoyaltyPoints = async (req, res) => {
  try {
    const { customerId, points, type, description } = req.body;
    // type: "earn" or "redeem"
    
    if (!customerId || !points || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId });
    if (!loyaltyRecord) {
      loyaltyRecord = new LoyaltyPoint({ customer: customerId, totalPoints: 0, transactions: [] });
    }

    if (type === 'redeem' && loyaltyRecord.totalPoints < points) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    if (type === 'earn') {
      loyaltyRecord.totalPoints += Number(points);
      loyaltyRecord.transactions.push({
        pointsEarned: Number(points),
        pointsRedeemed: 0,
        description: description || "Admin adjusted - Earned"
      });
    } else if (type === 'redeem') {
      loyaltyRecord.totalPoints -= Number(points);
      loyaltyRecord.transactions.push({
        pointsEarned: 0,
        pointsRedeemed: Number(points),
        description: description || "Admin adjusted - Redeemed"
      });
    }

    await loyaltyRecord.save();
    res.status(200).json({ message: "Points adjusted successfully", data: loyaltyRecord });

  } catch (error) {
    console.error("Error adjusting loyalty points:", error);
    res.status(500).json({ message: "Server error while adjusting loyalty points", error: error.message });
  }
};
