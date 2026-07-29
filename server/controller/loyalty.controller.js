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

    const LoyaltyLedger = require('../models/loyaltyLedger.model');

    const customers = await Customer.find({ is_active: { $ne: false } })
      .populate('loyaltyTier')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments({ is_active: { $ne: false } });

    const customerIds = customers.map(c => c._id);
    const now = new Date();

    const [loyaltyRecords, ledgerEntries] = await Promise.all([
      LoyaltyPoint.find({ customer: { $in: customerIds } }),
      LoyaltyLedger.find({
        customerId: { $in: customerIds },
        isExpired: false,
        $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
      })
    ]);

    const loyaltyMap = {};
    loyaltyRecords.forEach(rec => {
      loyaltyMap[rec.customer.toString()] = rec.totalPoints || 0;
    });

    const ledgerMap = {};
    ledgerEntries.forEach(entry => {
      const cId = entry.customerId.toString();
      const net = (entry.pointsEarned || 0) - (entry.pointsRedeemed || 0);
      ledgerMap[cId] = (ledgerMap[cId] || 0) + net;
    });

    const data = customers.map(customer => {
      const cId = customer._id.toString();
      const totalPts = Math.max(loyaltyMap[cId] || 0, ledgerMap[cId] || 0);
      return {
        _id: customer._id,
        customer: customer,
        totalPoints: totalPts
      };
    });

    res.status(200).json({
      data,
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
      try {
        const LoyaltyLedger = require('../models/loyaltyLedger.model');
        await LoyaltyLedger.create({
          customerId,
          sourceType: 'point',
          pointsEarned: Number(points),
          pointsRedeemed: 0,
          earnedDate: new Date()
        });
      } catch (lErr) {
        console.error("Error creating ledger entry on admin adjust:", lErr);
      }
    } else if (type === 'redeem') {
      loyaltyRecord.totalPoints -= Number(points);
      loyaltyRecord.transactions.push({
        pointsEarned: 0,
        pointsRedeemed: Number(points),
        description: description || "Admin adjusted - Redeemed"
      });
      try {
        const LoyaltyLedger = require('../models/loyaltyLedger.model');
        await LoyaltyLedger.create({
          customerId,
          sourceType: 'redemption',
          pointsEarned: 0,
          pointsRedeemed: Number(points),
          earnedDate: new Date()
        });
      } catch (lErr) {
        console.error("Error creating ledger entry on admin adjust:", lErr);
      }
    }

    await loyaltyRecord.save();
    res.status(200).json({ message: "Points adjusted successfully", data: loyaltyRecord });

  } catch (error) {
    console.error("Error adjusting loyalty points:", error);
    res.status(500).json({ message: "Server error while adjusting loyalty points", error: error.message });
  }
};
