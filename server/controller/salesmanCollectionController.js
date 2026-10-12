const SalesmanCollection = require('../models/SalesmanCollection');
const SalesmanRoute = require('../models/SalesmanRoute');
const SalesmanVisit = require('../models/SalesmanVisit');
const Salesman = require('../models/Salesman');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

async function getNextCollectionId() {
  const last = await SalesmanCollection.findOne().sort({ collectionId: -1 });
  return last && last.collectionId ? last.collectionId + 1 : 1;
}

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

// POST /api/salesman-collection
const addCollection = async (req, res) => {
  try {
    let {
      salesman,
      party,
      route,
      visit,
      collectionAmount,
      notes = '',
      status = 'Received',
      collectionDate,
    } = req.body;

    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      salesman = effectiveSalesmanId;
    }

    if (!collectionAmount || Number(collectionAmount) <= 0) {
      return res.status(400).json({ message: 'Valid collection amount is required' });
    }

    const collectionId = await getNextCollectionId();

    let salesmanName = '';
    if (salesman) {
      const sm = await Salesman.findById(salesman).select('name');
      if (sm) salesmanName = sm.name;
    }

    let partyName = '';
    if (party) {
      const p = await Customer.findById(party).select('name');
      if (p) partyName = typeof p.name === 'object' ? p.name.en || Object.values(p.name)[0] : p.name;
    }

    const newCollection = new SalesmanCollection({
      collectionId,
      salesman,
      salesmanName,
      party,
      partyName,
      route: route || null,
      visit: visit || null,
      collectionAmount: Number(collectionAmount),
      notes,
      status,
      collectionDate: collectionDate ? new Date(collectionDate) : new Date(),
      createdBy: req.user?._id || null,
    });

    const saved = await newCollection.save();

    // If attached to route, update route collection
    if (route) {
      await SalesmanRoute.findByIdAndUpdate(route, {
        $inc: { collection: Number(collectionAmount) },
      });
      if (party) {
        await SalesmanRoute.updateOne(
          { _id: route, 'parties.party': party },
          { $inc: { 'parties.$.collectionAmount': Number(collectionAmount) } }
        );
      }
    }

    // If attached to visit, update visit collection
    if (visit) {
      await SalesmanVisit.findByIdAndUpdate(visit, {
        $inc: { collection: Number(collectionAmount) },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Collection saved successfully',
      data: saved,
    });
  } catch (err) {
    console.error('addCollection error:', err);
    res.status(500).json({ message: 'Failed to add collection', error: err.message });
  }
};

// GET /api/salesman-collection/report
const getCollectionReport = async (req, res) => {
  try {
    const { fromDate, toDate, salesman } = req.query;
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);

    const dateFilter = {};
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      dateFilter.$gte = from;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }

    const collectionQuery = {};
    if (Object.keys(dateFilter).length > 0) {
      collectionQuery.collectionDate = dateFilter;
    }

    // If salesman user, force their ID. Otherwise use query filter if provided.
    if (effectiveSalesmanId) {
      collectionQuery.salesman = effectiveSalesmanId;
    } else if (salesman && salesman !== 'All Salesmen') {
      collectionQuery.salesman = salesman;
    }

    const visitQuery = {};
    if (Object.keys(dateFilter).length > 0) {
      visitQuery.visitDate = dateFilter;
    }
    if (effectiveSalesmanId) {
      visitQuery.salesman = effectiveSalesmanId;
    } else if (salesman && salesman !== 'All Salesmen') {
      visitQuery.salesman = salesman;
    }

    const [collections, visits] = await Promise.all([
      SalesmanCollection.find(collectionQuery)
        .populate('salesman', 'name code')
        .populate('party', 'name address')
        .populate('visit', 'visitDate purpose')
        .sort({ collectionDate: -1 }),
      SalesmanVisit.find(visitQuery),
    ]);

    // KPI computations
    const totalCollection = collections.reduce((sum, c) => sum + (c.collectionAmount || 0), 0);
    const totalVisits = visits.length;
    const uniquePartiesSet = new Set();

    collections.forEach((c) => {
      if (c.party) uniquePartiesSet.add(c.party.toString());
    });
    visits.forEach((v) => {
      if (v.party) uniquePartiesSet.add(v.party.toString());
    });

    const uniqueParties = uniquePartiesSet.size;
    const avgCollectionPerVisit = totalVisits > 0 ? (totalCollection / totalVisits).toFixed(2) : '0.00';

    // Summary by salesman
    const salesmanSummaryMap = new Map();

    collections.forEach((c) => {
      const sId = c.salesman ? (c.salesman._id ? c.salesman._id.toString() : c.salesman.toString()) : 'unknown';
      const sName = c.salesman?.name || c.salesmanName || 'Unknown';
      if (!salesmanSummaryMap.has(sId)) {
        salesmanSummaryMap.set(sId, {
          salesmanId: sId,
          salesmanName: sName,
          totalCollection: 0,
          totalVisits: 0,
        });
      }
      salesmanSummaryMap.get(sId).totalCollection += c.collectionAmount || 0;
    });

    visits.forEach((v) => {
      const sId = v.salesman ? v.salesman.toString() : 'unknown';
      const sName = v.salesmanName || 'Unknown';
      if (!salesmanSummaryMap.has(sId)) {
        salesmanSummaryMap.set(sId, {
          salesmanId: sId,
          salesmanName: sName,
          totalCollection: 0,
          totalVisits: 0,
        });
      }
      salesmanSummaryMap.get(sId).totalVisits += 1;
    });

    const summaryBySalesman = Array.from(salesmanSummaryMap.values()).map((s) => ({
      salesman: s.salesmanName,
      totalCollection: s.totalCollection,
      totalVisits: s.totalVisits,
      avgPerVisit: s.totalVisits > 0 ? (s.totalCollection / s.totalVisits).toFixed(2) : '0.00',
    }));

    // Detailed collection report
    const detailedReport = collections.map((c) => ({
      _id: c._id,
      collectionId: c.collectionId,
      visitDate: c.visit?.visitDate || c.collectionDate,
      salesman: c.salesman?.name || c.salesmanName,
      party: c.partyName || (c.party?.name ? (typeof c.party.name === 'object' ? c.party.name.en || Object.values(c.party.name)[0] : c.party.name) : '-'),
      collectionAmount: c.collectionAmount,
      status: c.status,
      collectionDate: c.collectionDate,
    }));

    res.status(200).json({
      kpis: {
        totalCollection: totalCollection.toFixed(2),
        totalVisits,
        uniqueParties,
        avgCollectionPerVisit,
      },
      detailedReport,
      summaryBySalesman: effectiveSalesmanId ? [] : summaryBySalesman,
    });
  } catch (err) {
    console.error('getCollectionReport error:', err);
    res.status(500).json({ message: 'Failed to generate collection report', error: err.message });
  }
};

module.exports = {
  addCollection,
  getCollectionReport,
};
