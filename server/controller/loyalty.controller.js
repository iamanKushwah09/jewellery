const LoyaltyPoint = require('../models/loyaltyPoint.model');
const Customer = require('../models/customer.model');

// Get loyalty points for a specific customer
exports.getCustomerLoyaltyPoints = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId })
      .populate('customer', 'name email mobile code print_name group_type')
      .lean();
    
    if (!loyaltyRecord) {
      const cust = await Customer.findById(customerId).select('name email mobile code print_name group_type').lean();
      return res.status(200).json({ 
        customer: cust || { _id: customerId }, 
        totalPoints: 0, 
        transactions: [] 
      });
    }
    
    // Sort transactions latest first
    if (Array.isArray(loyaltyRecord.transactions)) {
      loyaltyRecord.transactions.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    }
    
    res.status(200).json(loyaltyRecord);
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    res.status(500).json({ message: "Server error while fetching loyalty points", error: error.message });
  }
};

// Get all parties / customers with their loyalty points (Optimized for high-volume data)
exports.getAllLoyaltyPoints = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const groupType = req.query.groupType && req.query.groupType !== "All" ? req.query.groupType : null;
    const hasPoints = req.query.hasPoints; // 'yes' | 'no' | 'all'
    const tierId = req.query.tierId;

    const filter = {};

    // Filter by group_type if selected (e.g. Customer vs Vendor)
    if (groupType) {
      filter.group_type = groupType;
    }

    // Filter by tier if selected
    if (tierId && tierId !== "all") {
      if (tierId === "none") {
        filter.loyaltyTier = null;
      } else {
        filter.loyaltyTier = tierId;
      }
    }

    // Search by name, mobile, email, or code
    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { code: searchRegex },
        { print_name: searchRegex }
      ];
    }

    // Filter by points presence
    if (hasPoints === "yes") {
      const pointHolders = await LoyaltyPoint.find({ totalPoints: { $gt: 0 } }).distinct('customer');
      filter._id = { $in: pointHolders };
    } else if (hasPoints === "no") {
      const pointHolders = await LoyaltyPoint.find({ totalPoints: { $gt: 0 } }).distinct('customer');
      filter._id = { $nin: pointHolders };
    }

    // 1. Total count matching criteria
    const total = await Customer.countDocuments(filter);

    // 2. Fetch paginated customers with lean projection
    const customers = await Customer.find(filter)
      .select('name code email mobile group_type loyaltyTier loyaltyTierExpiry print_name')
      .populate({
        path: 'loyaltyTier',
        model: 'LoyaltyMembershipTier',
        select: 'name discountPercentage purchasePrice validityDays'
      })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 3. Ultra-fast single indexed query to fetch loyalty points for ONLY this page slice
    const customerIds = customers.map(c => c._id);
    const loyaltyRecords = await LoyaltyPoint.find({ customer: { $in: customerIds } })
      .select('customer totalPoints updatedAt')
      .lean();

    const pointsMap = new Map();
    loyaltyRecords.forEach(r => {
      if (r.customer) {
        pointsMap.set(r.customer.toString(), {
          totalPoints: Number(r.totalPoints) || 0,
          recordId: r._id,
          updatedAt: r.updatedAt
        });
      }
    });

    // 4. Merge results
    const data = customers.map(c => {
      const lp = pointsMap.get(c._id.toString());
      return {
        _id: lp?.recordId || c._id,
        customerId: c._id,
        customer: c,
        totalPoints: lp ? lp.totalPoints : 0,
        hasRecord: Boolean(lp),
        updatedAt: lp?.updatedAt || c.modified_date || null
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

// Add, Redeem, or Set points directly for any party (Admin editable)
exports.adjustLoyaltyPoints = async (req, res) => {
  try {
    const { customerId, points, type, description } = req.body;
    // type: "set" | "earn" | "redeem"
    
    if (!customerId || points === undefined || points === null || !type) {
      return res.status(400).json({ message: "Missing required fields (customerId, points, type)" });
    }

    const numPoints = Math.max(0, Math.round(Number(points)));
    if (isNaN(numPoints)) {
      return res.status(400).json({ message: "Points must be a valid non-negative number" });
    }

    let loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId });
    if (!loyaltyRecord) {
      loyaltyRecord = new LoyaltyPoint({ customer: customerId, totalPoints: 0, transactions: [] });
    }

    const oldPoints = Number(loyaltyRecord.totalPoints) || 0;
    let earned = 0;
    let redeemed = 0;
    let desc = description ? String(description).trim() : "";

    if (type === 'set') {
      const diff = numPoints - oldPoints;
      loyaltyRecord.totalPoints = numPoints;
      if (diff > 0) {
        earned = diff;
        desc = desc || `Admin set points to ${numPoints} (+${diff} pts)`;
      } else if (diff < 0) {
        redeemed = Math.abs(diff);
        desc = desc || `Admin set points to ${numPoints} (-${redeemed} pts)`;
      } else {
        return res.status(200).json({ 
          message: "Points unchanged", 
          data: { customerId, totalPoints: loyaltyRecord.totalPoints } 
        });
      }
    } else if (type === 'earn') {
      loyaltyRecord.totalPoints = oldPoints + numPoints;
      earned = numPoints;
      desc = desc || `Admin added +${numPoints} points`;
    } else if (type === 'redeem') {
      if (oldPoints < numPoints) {
        return res.status(400).json({ 
          message: `Insufficient points (Current: ${oldPoints}, Trying to redeem: ${numPoints})` 
        });
      }
      loyaltyRecord.totalPoints = Math.max(0, oldPoints - numPoints);
      redeemed = numPoints;
      desc = desc || `Admin deducted -${numPoints} points`;
    } else {
      return res.status(400).json({ message: "Invalid adjustment type. Use 'set', 'earn', or 'redeem'." });
    }

    // Record transaction
    loyaltyRecord.transactions.push({
      pointsEarned: earned,
      pointsRedeemed: redeemed,
      description: desc,
      date: new Date()
    });

    await loyaltyRecord.save();

    // Also record in LoyaltyLedger for audit trail
    try {
      const LoyaltyLedger = require('../models/loyaltyLedger.model');
      await LoyaltyLedger.create({
        customerId,
        sourceType: 'point',
        pointsEarned: earned,
        pointsRedeemed: redeemed,
        earnedDate: new Date()
      });
    } catch (ledgerErr) {
      console.warn("LoyaltyLedger log non-fatal error:", ledgerErr.message);
    }

    res.status(200).json({ 
      message: "Points updated successfully", 
      data: {
        customerId,
        totalPoints: loyaltyRecord.totalPoints,
        transactions: loyaltyRecord.transactions
      }
    });

  } catch (error) {
    console.error("Error adjusting loyalty points:", error);
    res.status(500).json({ message: "Server error while adjusting loyalty points", error: error.message });
  }
};
