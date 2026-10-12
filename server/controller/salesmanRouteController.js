const SalesmanRoute = require('../models/SalesmanRoute');
const Salesman = require('../models/Salesman');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

async function getNextRouteId() {
  const last = await SalesmanRoute.findOne().sort({ routeId: -1 });
  return last && last.routeId ? last.routeId + 1 : 1;
}

// Helper to determine logged-in salesman ID
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

// POST /api/salesman-route
const createRoute = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      return res.status(403).json({ message: 'Only admin can create and assign routes' });
    }

    const { salesman, routeDate, parties = [], notes = '' } = req.body;

    if (!salesman) {
      return res.status(400).json({ message: 'Salesman is required' });
    }

    const routeId = await getNextRouteId();

    const sm = await Salesman.findById(salesman).select('name');
    const salesmanName = sm ? sm.name : '';

    // Fetch party details
    let mappedParties = [];
    if (Array.isArray(parties) && parties.length > 0) {
      const partyDocs = await Customer.find({ _id: { $in: parties } }).select('name address');
      const partyMap = new Map();
      partyDocs.forEach((p) => {
        const pName = typeof p.name === 'object' ? p.name.en || Object.values(p.name)[0] : p.name;
        partyMap.set(p._id.toString(), pName);
      });

      mappedParties = parties.map((pid) => ({
        party: pid,
        partyName: partyMap.get(pid.toString()) || '',
        status: 'Pending',
        collectionAmount: 0,
      }));
    }

    const primaryParty = mappedParties.length > 0 ? mappedParties[0].party : null;
    const primaryPartyName = mappedParties.length > 0 ? mappedParties[0].partyName : '';

    const newRoute = new SalesmanRoute({
      routeId,
      salesman,
      salesmanName,
      routeDate: routeDate ? new Date(routeDate) : new Date(),
      party: primaryParty,
      partyName: primaryPartyName,
      parties: mappedParties,
      status: 'Pending',
      collectionAmount: 0,
      notes,
      createdBy: req.user?._id || null,
    });

    const savedRoute = await newRoute.save();

    res.status(201).json({
      success: true,
      message: 'Salesman route created successfully',
      data: savedRoute,
    });
  } catch (err) {
    console.error('createRoute error:', err);
    res.status(500).json({ message: 'Failed to create route', error: err.message });
  }
};

// GET /api/salesman-route
const getAllRoutes = async (req, res) => {
  try {
    const { search = '', status = '', salesman = '', date = '', page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { salesmanName: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { 'parties.partyName': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== '-- All Status --') {
      query.status = status;
    }

    // Determine effective salesman filter
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    let effectiveSalesman = effectiveSalesmanId || salesman;

    if (effectiveSalesman) {
      query.salesman = effectiveSalesman;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.routeDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [routes, total] = await Promise.all([
      SalesmanRoute.find(query)
        .populate('salesman', 'name code')
        .populate('party', 'name address phone')
        .populate('parties.party', 'name address phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SalesmanRoute.countDocuments(query),
    ]);

    const mappedRoutes = routes.map((r) => {
      const doc = r.toObject ? r.toObject() : { ...r };
      doc.collection = doc.collectionAmount || 0;
      return doc;
    });

    res.status(200).json({
      routes: mappedRoutes,
      totalDoc: total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('getAllRoutes error:', err);
    res.status(500).json({ message: 'Failed to fetch routes', error: err.message });
  }
};

// GET /api/salesman-route/:id
const getRouteById = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const route = await SalesmanRoute.findById(req.params.id)
      .populate('salesman', 'name code')
      .populate('party', 'name address phone')
      .populate('parties.party', 'name address phone');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (effectiveSalesmanId) {
      const sId = route.salesman?._id?.toString() || route.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: "You are not authorized to view another salesman's route" });
      }
    }

    const doc = route.toObject ? route.toObject() : { ...route };
    doc.collection = doc.collectionAmount || 0;

    res.status(200).json(doc);
  } catch (err) {
    console.error('getRouteById error:', err);
    res.status(500).json({ message: 'Failed to fetch route', error: err.message });
  }
};

// PUT /api/salesman-route/:id
const updateRoute = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      const existing = await SalesmanRoute.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Route not found' });
      }
      const sId = existing.salesman?._id?.toString() || existing.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: "You are not authorized to update another salesman's route" });
      }
    }

    const { status, notes, collection, collectionAmount } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (collection !== undefined || collectionAmount !== undefined) {
      updateData.collectionAmount = Number(collection ?? collectionAmount);
    }

    const updated = await SalesmanRoute.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('updateRoute error:', err);
    res.status(500).json({ message: 'Failed to update route', error: err.message });
  }
};

// DELETE /api/salesman-route/:id
const deleteRoute = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      return res.status(403).json({ message: 'Salesmen are not permitted to delete routes' });
    }
    const deleted = await SalesmanRoute.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json({ success: true, message: 'Route deleted successfully' });
  } catch (err) {
    console.error('deleteRoute error:', err);
    res.status(500).json({ message: 'Failed to delete route', error: err.message });
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
};
