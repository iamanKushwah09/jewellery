const SalesmanVisit = require('../models/SalesmanVisit');
const Salesman = require('../models/Salesman');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const SalesmanCollection = require('../models/SalesmanCollection');
const SalesmanRoute = require('../models/SalesmanRoute');
const { processLocationUpdate } = require('../services/socketService');

// Helper to get next sequential visitId
async function getNextVisitId() {
  const last = await SalesmanVisit.findOne().sort({ visitId: -1 });
  return last && last.visitId ? last.visitId + 1 : 1;
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

// POST /api/salesman-visit
const createVisit = async (req, res) => {
  try {
    const {
      salesman,
      party,
      route,
      visitDate,
      purpose,
      notes,
      location,
      checkInTime,
      checkOutTime,
      photo,
      collection,
      collectionNotes,
      status = 'Pending',
    } = req.body;

    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const targetSalesman = effectiveSalesmanId || salesman;

    const visitId = await getNextVisitId();

    let salesmanName = '';
    if (targetSalesman) {
      const sm = await Salesman.findById(targetSalesman).select('name');
      if (sm) salesmanName = sm.name;
    }

    let partyName = '';
    if (party) {
      const p = await Customer.findById(party).select('name');
      if (p) partyName = typeof p.name === 'object' ? p.name.en || Object.values(p.name)[0] : p.name;
    }

    const newVisit = new SalesmanVisit({
      visitId,
      salesman: targetSalesman,
      salesmanName,
      party,
      partyName,
      route: route || null,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      purpose,
      notes: notes || '',
      location: {
        address: location?.address || '',
        latitude: location?.latitude != null ? Number(location.latitude) : null,
        longitude: location?.longitude != null ? Number(location.longitude) : null,
        accuracy: location?.accuracy != null ? Number(location.accuracy) : null,
      },
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      photo: photo || '',
      collectionAmount: Number(collection) || Number(req.body.collectionAmount) || 0,
      collectionNotes: collectionNotes || '',
      status: status || 'Pending',
      createdBy: req.user?._id || null,
    });

    const savedVisit = await newVisit.save();

    // If a collection amount was provided, also create a SalesmanCollection entry
    if (Number(collection) > 0) {
      const lastCol = await SalesmanCollection.findOne().sort({ collectionId: -1 });
      const collectionId = lastCol && lastCol.collectionId ? lastCol.collectionId + 1 : 1;

      await SalesmanCollection.create({
        collectionId,
        salesman: targetSalesman,
        salesmanName,
        party,
        partyName,
        route: route || null,
        visit: savedVisit._id,
        collectionAmount: Number(collection),
        notes: collectionNotes || notes || '',
        collectionDate: visitDate ? new Date(visitDate) : new Date(),
        status: 'Received',
        createdBy: req.user?._id || null,
      });

      // Update route total collection if attached
      if (route) {
        await SalesmanRoute.findByIdAndUpdate(route, {
          $inc: { collectionAmount: Number(collection) },
        });
      }
    }

    // If route was attached, update party status in route
    if (route && party) {
      await SalesmanRoute.updateOne(
        { _id: route, 'parties.party': party },
        {
          $set: {
            'parties.$.status': 'Completed',
            'parties.$.visitId': savedVisit._id,
            'parties.$.collectionAmount': Number(collection) || 0,
          },
        }
      );
    }

    // Broadcast live location if coordinates captured
    if (targetSalesman && location?.latitude != null && location?.longitude != null) {
      try {
        await processLocationUpdate({
          salesmanId: targetSalesman,
          salesmanName,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          accuracy: location.accuracy != null ? Number(location.accuracy) : 10,
          address: location.address || '',
        });
      } catch (locErr) {
        console.warn('Location update error during visit creation:', locErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Salesman visit created successfully',
      data: savedVisit,
    });
  } catch (err) {
    console.error('createVisit error:', err);
    res.status(500).json({ message: 'Failed to create visit', error: err.message });
  }
};

// GET /api/salesman-visit
const getAllVisits = async (req, res) => {
  try {
    const { search = '', status = '', salesman = '', date = '', page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { salesmanName: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
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
      query.visitDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [visits, total] = await Promise.all([
      SalesmanVisit.find(query)
        .populate('salesman', 'name code')
        .populate('party', 'name address phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SalesmanVisit.countDocuments(query),
    ]);

    const mappedVisits = visits.map((v) => {
      const doc = v.toObject ? v.toObject() : { ...v };
      doc.collection = doc.collectionAmount || 0;
      return doc;
    });

    res.status(200).json({
      visits: mappedVisits,
      totalDoc: total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('getAllVisits error:', err);
    res.status(500).json({ message: 'Failed to fetch visits', error: err.message });
  }
};

// GET /api/salesman-visit/:id
const getVisitById = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const visit = await SalesmanVisit.findById(req.params.id)
      .populate('salesman', 'name code')
      .populate('party', 'name address phone');

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (effectiveSalesmanId) {
      const sId = visit.salesman?._id?.toString() || visit.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: "You are not authorized to view another salesman's visit" });
      }
    }

    res.status(200).json(visit);
  } catch (err) {
    console.error('getVisitById error:', err);
    res.status(500).json({ message: 'Failed to fetch visit', error: err.message });
  }
};

// PUT /api/salesman-visit/:id
const updateVisit = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      const existing = await SalesmanVisit.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      const sId = existing.salesman?._id?.toString() || existing.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: "You are not authorized to update another salesman's visit" });
      }
    }

    const { purpose, notes, status, location, checkInTime, checkOutTime, photo, inPhoto, outPhoto, collection, collectionAmount } = req.body;

    const updateData = {};
    if (purpose !== undefined) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (photo !== undefined) updateData.photo = photo;
    if (inPhoto !== undefined) updateData.inPhoto = inPhoto;
    if (outPhoto !== undefined) updateData.outPhoto = outPhoto;
    if (collection !== undefined || collectionAmount !== undefined) {
      updateData.collectionAmount = Number(collectionAmount) || Number(collection) || 0;
    }
    if (checkInTime) updateData.checkInTime = new Date(checkInTime);
    if (checkOutTime) updateData.checkOutTime = new Date(checkOutTime);
    if (location) {
      updateData.location = {
        address: location.address || '',
        latitude: location.latitude != null ? Number(location.latitude) : null,
        longitude: location.longitude != null ? Number(location.longitude) : null,
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
      };
    }

    const updated = await SalesmanVisit.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Visit updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('updateVisit error:', err);
    res.status(500).json({ message: 'Failed to update visit', error: err.message });
  }
};

// PUT /api/salesman-visit/:id/check-in
const checkInVisit = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const { inPhoto, location, notes } = req.body;

    const visit = await SalesmanVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (effectiveSalesmanId) {
      const sId = visit.salesman?._id?.toString() || visit.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: 'You can only check in to your own assigned visit' });
      }
    }

    const now = new Date();
    visit.checkInTime = now;
    visit.status = 'In Progress';

    if (inPhoto) {
      visit.inPhoto = inPhoto;
      visit.photo = inPhoto; // backwards compatibility
    }

    if (notes) {
      visit.notes = visit.notes ? `${visit.notes}\n[Check-in: ${notes}]` : `[Check-in: ${notes}]`;
    }

    if (location && location.latitude != null && location.longitude != null) {
      visit.inLocation = {
        address: location.address || '',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
        timestamp: now,
      };
      visit.location = {
        address: location.address || '',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
      };

      // Broadcast live location to admin tracking via Socket.IO
      if (visit.salesman) {
        try {
          await processLocationUpdate({
            salesmanId: visit.salesman,
            salesmanName: visit.salesmanName,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            accuracy: location.accuracy != null ? Number(location.accuracy) : 10,
            address: location.address || '',
          });
        } catch (socketErr) {
          console.warn('Socket location update error during check-in:', socketErr.message);
        }
      }
    }

    const saved = await visit.save();

    res.status(200).json({
      success: true,
      message: 'Checked in successfully! Visit is now In Progress.',
      data: saved,
    });
  } catch (err) {
    console.error('checkInVisit error:', err);
    res.status(500).json({ message: 'Failed to check in', error: err.message });
  }
};

// PUT /api/salesman-visit/:id/check-out
const checkOutVisit = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const { outPhoto, location, notes, collection, collectionAmount, collectionNotes } = req.body;

    const visit = await SalesmanVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (effectiveSalesmanId) {
      const sId = visit.salesman?._id?.toString() || visit.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: 'You can only check out of your own assigned visit' });
      }
    }

    const now = new Date();
    visit.checkOutTime = now;
    visit.status = 'Completed';

    if (outPhoto) {
      visit.outPhoto = outPhoto;
    }

    const finalCollection = Number(collectionAmount) || Number(collection) || 0;
    if (finalCollection > 0) {
      visit.collectionAmount = finalCollection;
    }
    if (collectionNotes) {
      visit.collectionNotes = collectionNotes;
    }

    if (notes) {
      visit.notes = visit.notes ? `${visit.notes}\n[Check-out: ${notes}]` : `[Check-out: ${notes}]`;
    }

    if (location && location.latitude != null && location.longitude != null) {
      visit.outLocation = {
        address: location.address || '',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
        timestamp: now,
      };
      visit.location = {
        address: location.address || '',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
      };

      // Broadcast live location update
      if (visit.salesman) {
        try {
          await processLocationUpdate({
            salesmanId: visit.salesman,
            salesmanName: visit.salesmanName,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            accuracy: location.accuracy != null ? Number(location.accuracy) : 10,
            address: location.address || '',
          });
        } catch (socketErr) {
          console.warn('Socket location update error during check-out:', socketErr.message);
        }
      }
    }

    // If money was collected, create SalesmanCollection entry
    if (finalCollection > 0) {
      try {
        const lastCol = await SalesmanCollection.findOne().sort({ collectionId: -1 });
        const colId = lastCol && lastCol.collectionId ? lastCol.collectionId + 1 : 1;

        await SalesmanCollection.create({
          collectionId: colId,
          salesman: visit.salesman,
          salesmanName: visit.salesmanName,
          party: visit.party,
          partyName: visit.partyName,
          route: visit.route || null,
          visit: visit._id,
          collectionAmount: finalCollection,
          notes: collectionNotes || notes || '',
          collectionDate: now,
          status: 'Received',
          createdBy: req.user?._id || null,
        });

        if (visit.route) {
          await SalesmanRoute.findByIdAndUpdate(visit.route, {
            $inc: { collectionAmount: finalCollection },
          });
        }
      } catch (colErr) {
        console.warn('SalesmanCollection creation error:', colErr.message);
      }
    }

    // If attached to a route, mark party status as Completed in route
    if (visit.route && visit.party) {
      try {
        await SalesmanRoute.updateOne(
          { _id: visit.route, 'parties.party': visit.party },
          {
            $set: {
              'parties.$.status': 'Completed',
              'parties.$.visitId': visit._id,
              'parties.$.collectionAmount': finalCollection,
            },
          }
        );
      } catch (routeErr) {
        console.warn('Route party update error:', routeErr.message);
      }
    }

    const saved = await visit.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully! Visit marked as Completed.',
      data: saved,
    });
  } catch (err) {
    console.error('checkOutVisit error:', err);
    res.status(500).json({ message: 'Failed to check out', error: err.message });
  }
};

// POST /api/salesman-visit/:id/add-photo
const addVisitPhoto = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    const { url, caption = '', address = '', latitude = null, longitude = null, accuracy = null } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const visit = await SalesmanVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (effectiveSalesmanId) {
      const sId = visit.salesman?._id?.toString() || visit.salesman?.toString();
      if (sId !== effectiveSalesmanId.toString()) {
        return res.status(403).json({ message: 'You can only add photos to your own assigned visit' });
      }
    }

    const photoEntry = {
      url,
      caption: caption || '',
      address: address || '',
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      timestamp: new Date(),
    };

    if (!Array.isArray(visit.additionalPhotos)) {
      visit.additionalPhotos = [];
    }
    visit.additionalPhotos.push(photoEntry);

    // Broadcast live location if coordinates provided
    if (visit.salesman && latitude != null && longitude != null) {
      try {
        await processLocationUpdate(visit.salesman, {
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: accuracy != null ? Number(accuracy) : 10,
          address: address || '',
        });
      } catch (socketErr) {
        console.warn('Socket location update error during add photo:', socketErr.message);
      }
    }

    await visit.save();

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: photoEntry,
      visit,
    });
  } catch (err) {
    console.error('addVisitPhoto error:', err);
    res.status(500).json({ message: 'Failed to add photo', error: err.message });
  }
};

// DELETE /api/salesman-visit/:id
const deleteVisit = async (req, res) => {
  try {
    const effectiveSalesmanId = await getEffectiveSalesmanId(req);
    if (effectiveSalesmanId) {
      return res.status(403).json({ message: 'Salesmen are not permitted to delete visits' });
    }
    const deleted = await SalesmanVisit.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    res.status(200).json({ success: true, message: 'Visit deleted successfully' });
  } catch (err) {
    console.error('deleteVisit error:', err);
    res.status(500).json({ message: 'Failed to delete visit', error: err.message });
  }
};

module.exports = {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisit,
  checkInVisit,
  checkOutVisit,
  addVisitPhoto,
  deleteVisit,
};
