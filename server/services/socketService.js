const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const SalesmanCurrentLocation = require('../models/SalesmanCurrentLocation');
const SalesmanLocationHistory = require('../models/SalesmanLocationHistory');
const Salesman = require('../models/Salesman');

let io = null;

// Throttling cache: salesmanId -> { lastSavedTime, lastLat, lastLng }
const locationThrottleCache = new Map();
const MIN_DISTANCE_METERS = 10; // Only write history if moved >= 10m
const MIN_TIME_SECONDS = 15;   // Or >= 15 seconds passed

// Calculate distance in meters between two lat/lng points
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Active salesman socket registry: salesmanId -> Set of socket IDs
const activeSalesmanSockets = new Map();

function isSalesmanConnected(salesmanId) {
  if (!salesmanId) return false;
  const set = activeSalesmanSockets.get(salesmanId.toString());
  return !!(set && set.size > 0);
}

// Compute live / stale / offline status based on lastSeenAt and active socket connection
function computeStatus(lastSeenAt, isOnline = true, salesmanId = null) {
  if (salesmanId && isSalesmanConnected(salesmanId)) {
    return 'live';
  }
  if (!lastSeenAt || !isOnline) return 'offline';
  const ageSeconds = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (ageSeconds <= 300) return 'live';   // Active within 5 minutes = LIVE
  if (ageSeconds <= 900) return 'stale';  // Active within 15 minutes = STALE
  return 'offline';
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: false,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next();
      }

      if (process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.user = decoded;
          if (decoded.salesman_id) {
            socket.salesmanId = decoded.salesman_id.toString();
          }
        } catch (e) {
          // Token expired or invalid
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    // Admin room join
    socket.on('join:admin_tracking', () => {
      socket.join('admin:tracking');
      console.log(`[Socket] Socket ${socket.id} joined admin:tracking`);
    });

    // Salesman room join / presence announcement
    socket.on('join:salesman', async (salesmanId) => {
      if (salesmanId) {
        const sidStr = salesmanId.toString();
        socket.join(`salesman:${sidStr}`);
        socket.salesmanId = sidStr;

        if (!activeSalesmanSockets.has(sidStr)) {
          activeSalesmanSockets.set(sidStr, new Set());
        }
        activeSalesmanSockets.get(sidStr).add(socket.id);

        const now = new Date();
        try {
          await SalesmanCurrentLocation.findOneAndUpdate(
            { salesmanId: sidStr },
            { isOnline: true, trackingStatus: 'live', lastSeenAt: now },
            { upsert: false }
          );

          io.to('admin:tracking').emit('admin:salesman:status', {
            salesmanId: sidStr,
            isOnline: true,
            trackingStatus: 'live',
            lastSeenAt: now,
          });
          console.log(`[Socket] Salesman ${sidStr} connected & joined room. Status: LIVE`);
        } catch (err) {
          console.error('[Socket] Error updating salesman online status:', err);
        }
      }
    });

    // Salesman heartbeat (keeps presence LIVE even when stationary)
    socket.on('salesman:heartbeat', async (data = {}) => {
      const sid = socket.salesmanId || data.salesmanId;
      if (sid) {
        const sidStr = sid.toString();
        const now = new Date();
        const updateFields = { isOnline: true, trackingStatus: 'live', lastSeenAt: now };
        if (data.battery != null) updateFields.battery = data.battery;

        try {
          await SalesmanCurrentLocation.findOneAndUpdate({ salesmanId: sidStr }, updateFields);
          io.to('admin:tracking').emit('admin:salesman:status', {
            salesmanId: sidStr,
            isOnline: true,
            trackingStatus: 'live',
            lastSeenAt: now,
            battery: data.battery,
          });
        } catch (e) {
          // silent
        }
      }
    });

    // Location update event from salesman device
    socket.on('salesman:location:update', async (data) => {
      try {
        await processLocationUpdate(data);
      } catch (err) {
        console.error('[Socket] Error in salesman:location:update:', err);
      }
    });

    // Alias location event
    socket.on('location:update', async (data) => {
      try {
        await processLocationUpdate(data);
      } catch (err) {
        console.error('[Socket] Error in location:update:', err);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.salesmanId) {
        const sidStr = socket.salesmanId.toString();
        const set = activeSalesmanSockets.get(sidStr);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            activeSalesmanSockets.delete(sidStr);
          }
        }

        // Grace period before marking offline (handles page navigation, screen lock, short network drop)
        setTimeout(async () => {
          if (!isSalesmanConnected(sidStr)) {
            try {
              const loc = await SalesmanCurrentLocation.findOne({ salesmanId: sidStr });
              const currentStatus = computeStatus(loc?.lastSeenAt, loc?.isOnline, sidStr);

              if (currentStatus === 'offline') {
                await SalesmanCurrentLocation.findOneAndUpdate(
                  { salesmanId: sidStr },
                  { isOnline: false, trackingStatus: 'offline' }
                );
                io.to('admin:tracking').emit('admin:salesman:status', {
                  salesmanId: sidStr,
                  isOnline: false,
                  trackingStatus: 'offline',
                  lastSeenAt: new Date(),
                });
                console.log(`[Socket] Salesman ${sidStr} marked offline after disconnect.`);
              }
            } catch (e) {
              console.error('[Socket] Disconnect handler error:', e);
            }
          }
        }, 45000); // 45 seconds grace period
      }
    });
  });

  // Periodic heartbeat: sync status changes
  setInterval(async () => {
    try {
      const activeLocations = await SalesmanCurrentLocation.find({
        trackingStatus: { $in: ['live', 'stale'] },
      });

      for (const loc of activeLocations) {
        const sidStr = loc.salesmanId?.toString();
        const currentComputed = computeStatus(loc.lastSeenAt, loc.isOnline, sidStr);

        if (currentComputed !== loc.trackingStatus) {
          loc.trackingStatus = currentComputed;
          loc.isOnline = currentComputed !== 'offline';
          await loc.save();

          if (io) {
            io.to('admin:tracking').emit('admin:salesman:status', {
              salesmanId: loc.salesmanId,
              trackingStatus: currentComputed,
              lastSeenAt: loc.lastSeenAt,
              isOnline: loc.isOnline,
            });
          }
        }
      }
    } catch (err) {
      // silent
    }
  }, 30000);

  return io;
}

// Process and store location update with polymorphic signature support
// Accepts either: processLocationUpdate({ salesmanId, latitude, ... })
// OR: processLocationUpdate(salesmanId, { latitude, ... })
async function processLocationUpdate(firstArg, secondArg) {
  let data = {};
  if (firstArg && typeof firstArg === 'object' && !secondArg) {
    data = firstArg;
  } else if (firstArg && secondArg && typeof secondArg === 'object') {
    data = { ...secondArg, salesmanId: firstArg };
  } else {
    return null;
  }

  const {
    salesmanId,
    latitude,
    longitude,
    accuracy = 0,
    speed = 0,
    heading = 0,
    battery = null,
    address = '',
    trackingSessionId = '',
  } = data;

  if (!salesmanId || latitude == null || longitude == null) {
    return null;
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const now = new Date();

  // Find salesman info if name not provided
  let salesmanName = data.salesmanName || '';
  if (!salesmanName) {
    try {
      const sm = await Salesman.findById(salesmanId).select('name');
      if (sm) salesmanName = sm.name;
    } catch (e) {}
  }

  // 1. Update or create current location (GeoJSON coordinates: [lng, lat])
  const currentLoc = await SalesmanCurrentLocation.findOneAndUpdate(
    { salesmanId },
    {
      salesmanId,
      salesmanName,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      latitude: lat,
      longitude: lng,
      accuracy,
      speed,
      heading,
      battery,
      address: address || '',
      trackingStatus: 'live',
      trackingSessionId,
      lastSeenAt: now,
      isOnline: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // If address is missing, asynchronously resolve it in background
  if (!address) {
    try {
      const { resolveAddressFromCoordinates } = require('../controller/locationController');
      resolveAddressFromCoordinates(lat, lng)
        .then(async (res) => {
          if (res?.address) {
            await SalesmanCurrentLocation.findOneAndUpdate(
              { salesmanId },
              { address: res.address }
            );
            if (io) {
              io.to('admin:tracking').emit('admin:location:update', {
                salesmanId,
                salesmanName,
                latitude: lat,
                longitude: lng,
                accuracy,
                speed,
                heading,
                battery,
                address: res.address,
                lastSeenAt: now,
                trackingStatus: 'live',
              });
            }
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  // 2. Throttled insert into history
  const lastCache = locationThrottleCache.get(salesmanId.toString());
  const shouldSaveHistory =
    !lastCache ||
    (now.getTime() - lastCache.lastSavedTime) / 1000 >= MIN_TIME_SECONDS ||
    getDistanceInMeters(lastCache.lastLat, lastCache.lastLng, lat, lng) >= MIN_DISTANCE_METERS;

  if (shouldSaveHistory) {
    await SalesmanLocationHistory.create({
      salesmanId,
      trackingSessionId,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      latitude: lat,
      longitude: lng,
      accuracy,
      speed,
      heading,
      battery,
      address,
      timestamp: now,
    });

    locationThrottleCache.set(salesmanId.toString(), {
      lastSavedTime: now.getTime(),
      lastLat: lat,
      lastLng: lng,
    });
  }

  // 3. Emit real-time update to admin tracking room
  if (io) {
    io.to('admin:tracking').emit('admin:location:update', {
      salesmanId,
      salesmanName,
      latitude: lat,
      longitude: lng,
      accuracy,
      speed,
      heading,
      battery,
      address,
      lastSeenAt: now,
      trackingStatus: 'live',
    });
  }

  return currentLoc;
}

function getIo() {
  return io;
}

module.exports = {
  initSocket,
  getIo,
  processLocationUpdate,
  computeStatus,
  isSalesmanConnected,
};
