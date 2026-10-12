const SalesmanCurrentLocation = require('../models/SalesmanCurrentLocation');
const SalesmanLocationHistory = require('../models/SalesmanLocationHistory');
const Salesman = require('../models/Salesman');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const SalesmanVisit = require('../models/SalesmanVisit');
const SalesmanCollection = require('../models/SalesmanCollection');
const { processLocationUpdate, computeStatus, isSalesmanConnected } = require('../services/socketService');

// Helper to get effective salesman ID for logged in user
async function getEffectiveSalesmanId(req) {
  // 1. Direct from JWT token
  if (req.user?.salesman_id) {
    return req.user.salesman_id;
  }

  // 2. Query Admin DB record if token is older or missing salesman_id
  if (req.user?._id) {
    try {
      const adminUser = await Admin.findById(req.user._id).select('salesman_id role');
      if (adminUser?.salesman_id) {
        return adminUser.salesman_id;
      }
    } catch (e) {
      console.warn('Error fetching admin record for salesman_id check:', e.message);
    }
  }

  // 3. Match Salesman collection by user name or email if user has salesman role
  const isSalesmanRole =
    req.user?.role &&
    (typeof req.user.role === 'string' && req.user.role.toLowerCase().includes('salesman'));

  if (isSalesmanRole || req.user?.email) {
    const candidateName =
      typeof req.user?.name === 'object'
        ? req.user.name.en || Object.values(req.user.name)[0]
        : req.user?.name;

    const queryConditions = [];
    if (candidateName) {
      queryConditions.push({ name: { $regex: new RegExp(`^${candidateName}$`, 'i') } });
    }
    if (req.user?.email) {
      queryConditions.push({ email: req.user.email });
    }

    if (queryConditions.length > 0) {
      const sm = await Salesman.findOne({ $or: queryConditions });
      if (sm) return sm._id;
    }
  }

  return null;
}

// GET /api/salesman-tracking/live-locations
// Returns live locations (all active salesmen for Admin, only self for Salesman)
const getLiveLocations = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);

    const smQuery = { is_active: true };
    if (effectiveSalesmanId) {
      smQuery._id = effectiveSalesmanId;
    }

    // Fetch active salesmen
    const allSalesmen = await Salesman.find(smQuery).select('name code app_code');

    const locQuery = {};
    if (effectiveSalesmanId) {
      locQuery.salesmanId = effectiveSalesmanId;
    }

    // Fetch existing location records
    const locations = await SalesmanCurrentLocation.find(locQuery).lean();
    const locMap = new Map();
    locations.forEach((loc) => {
      locMap.set(loc.salesmanId.toString(), loc);
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todayVisits, todayCollections] = await Promise.all([
      SalesmanVisit.find({ visitDate: { $gte: startOfDay, $lte: endOfDay } }).select('salesman').lean(),
      SalesmanCollection.find({ collectionDate: { $gte: startOfDay, $lte: endOfDay } }).select('salesman collectionAmount').lean(),
    ]);

    const visitCountMap = new Map();
    todayVisits.forEach((v) => {
      if (v.salesman) {
        const id = v.salesman.toString();
        visitCountMap.set(id, (visitCountMap.get(id) || 0) + 1);
      }
    });

    const collectionSumMap = new Map();
    todayCollections.forEach((c) => {
      if (c.salesman) {
        const id = c.salesman.toString();
        collectionSumMap.set(id, (collectionSumMap.get(id) || 0) + (c.collectionAmount || 0));
      }
    });

    const result = allSalesmen.map((s) => {
      const sIdStr = s._id.toString();
      const loc = locMap.get(sIdStr);
      const visitsToday = visitCountMap.get(sIdStr) || 0;
      const collection = collectionSumMap.get(sIdStr) || 0;

      if (loc) {
        const status = computeStatus(loc.lastSeenAt, loc.isOnline, s._id);
        return {
          salesmanId: s._id,
          name: s.name,
          code: s.code,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy || 0,
          speed: loc.speed || 0,
          heading: loc.heading || 0,
          battery: loc.battery,
          address: loc.address || '',
          lastSeenAt: loc.lastSeenAt,
          trackingStatus: status,
          isOnline: status !== 'offline',
          visitsToday,
          collection,
        };
      } else {
        const isConnected = isSalesmanConnected(s._id);
        const status = isConnected ? 'live' : 'offline';
        return {
          salesmanId: s._id,
          name: s.name,
          code: s.code,
          latitude: null,
          longitude: null,
          accuracy: 0,
          speed: 0,
          heading: 0,
          battery: null,
          address: isConnected ? 'Online (Active in App)' : 'No location recorded',
          lastSeenAt: isConnected ? new Date() : null,
          trackingStatus: status,
          isOnline: isConnected,
          visitsToday,
          collection,
        };
      }
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('getLiveLocations error:', err);
    res.status(500).json({ message: 'Failed to fetch live locations', error: err.message });
  }
};

// GET /api/salesman-tracking/history/:salesmanId
// Returns today's location points or route history
const getLocationHistory = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    // If logged in as salesman, restrict target to own ID
    const targetSalesmanId = effectiveSalesmanId ? effectiveSalesmanId.toString() : req.params.salesmanId;
    const { date } = req.query;

    let startOfDay, endOfDay;
    if (date) {
      startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
    }

    const history = await SalesmanLocationHistory.find({
      salesmanId: targetSalesmanId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ timestamp: 1 })
      .select('latitude longitude speed heading accuracy timestamp address');

    res.status(200).json(history);
  } catch (err) {
    console.error('getLocationHistory error:', err);
    res.status(500).json({ message: 'Failed to fetch location history', error: err.message });
  }
};

// POST /api/salesman-tracking/update-location
// REST fallback for location tracking
const updateLocationRest = async (req, res) => {
  try {
    const record = await processLocationUpdate(req.body);
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error('updateLocationRest error:', err);
    res.status(500).json({ message: 'Failed to update location', error: err.message });
  }
};

// GET /api/salesman-tracking/today-summary
const getTodaySummary = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const visitQuery = { visitDate: { $gte: startOfDay, $lte: endOfDay } };
    const collectionQuery = { collectionDate: { $gte: startOfDay, $lte: endOfDay } };
    const salesmanQuery = { is_active: true };
    const locQuery = {};

    if (effectiveSalesmanId) {
      visitQuery.salesman = effectiveSalesmanId;
      collectionQuery.salesman = effectiveSalesmanId;
      salesmanQuery._id = effectiveSalesmanId;
      locQuery.salesmanId = effectiveSalesmanId;
    }

    const [todayVisits, todayCollections, allSalesmen, activeLocations] = await Promise.all([
      SalesmanVisit.find(visitQuery),
      SalesmanCollection.find(collectionQuery),
      Salesman.find(salesmanQuery),
      SalesmanCurrentLocation.find(locQuery),
    ]);

    let liveCount = 0;
    let staleCount = 0;
    let offlineCount = 0;

    activeLocations.forEach((loc) => {
      const status = computeStatus(loc.lastSeenAt, loc.isOnline, loc.salesmanId);
      if (status === 'live') liveCount++;
      else if (status === 'stale') staleCount++;
      else offlineCount++;
    });

    const totalCollection = todayCollections.reduce((sum, c) => sum + (c.collectionAmount || 0), 0);

    res.status(200).json({
      totalSalesmen: allSalesmen.length,
      activeNow: liveCount,
      staleCount,
      offlineCount,
      todayVisitsCount: todayVisits.length,
      todayTotalCollection: totalCollection,
    });
  } catch (err) {
    console.error('getTodaySummary error:', err);
    res.status(500).json({ message: 'Failed to fetch today summary', error: err.message });
  }
};

module.exports = {
  getLiveLocations,
  getLocationHistory,
  updateLocationRest,
  getTodaySummary,
};
