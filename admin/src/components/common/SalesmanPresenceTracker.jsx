import React, { useEffect, useRef, useContext, useState } from 'react';
import io from 'socket.io-client';
import { AdminContext } from '@/context/AdminContext';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';

/**
 * SalesmanPresenceTracker
 * Runs automatically across the entire admin panel for any logged-in salesman.
 * 1. Maintains Socket.IO connection & sends heartbeats (Salesman stays LIVE/Online).
 * 2. Periodically captures device GPS in the background and broadcasts location.
 * 3. Works across all pages (Dashboard, Visits, Routes, Orders).
 */
const SalesmanPresenceTracker = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  const [salesmanId, setSalesmanId] = useState(adminInfo?.salesman_id || null);
  const [gpsActive, setGpsActive] = useState(false);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const lastRestTimeRef = useRef(0);
  const lastCoordsRef = useRef({ lat: 0, lng: 0 });

  // Resolve salesmanId fallback if not present in token
  useEffect(() => {
    if (adminInfo?.salesman_id) {
      setSalesmanId(adminInfo.salesman_id);
    } else if (isSalesman && !salesmanId) {
      SalesmanVisitServices.getLiveLocations()
        .then((data) => {
          if (Array.isArray(data)) {
            const myEmail = adminInfo?.email?.toLowerCase();
            const myName = (typeof adminInfo?.name === 'object' ? adminInfo.name?.en : adminInfo?.name)?.toLowerCase();
            const matched = data.find(
              (s) =>
                (s.email && s.email.toLowerCase() === myEmail) ||
                (s.name && s.name.toLowerCase() === myName)
            );
            if (matched) {
              setSalesmanId(matched.salesmanId || matched._id);
            } else if (data.length > 0 && adminInfo?.roleName?.toLowerCase().includes('salesman')) {
              setSalesmanId(data[0].salesmanId || data[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [adminInfo, isSalesman, salesmanId]);

  // Battery status query
  const getDeviceBattery = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const b = await navigator.getBattery();
        return Math.round(b.level * 100);
      }
    } catch (e) {}
    return null;
  };

  // Socket Connection & Heartbeat
  useEffect(() => {
    if (!isSalesman || !salesmanId) return;

    const socketUrl = import.meta.env.VITE_APP_API_SOCKET_URL || 'http://localhost:5055';
    const socket = io(socketUrl, {
      auth: { token: adminInfo?.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[SalesmanTracker] Connected to Gateway. Joining salesman:${salesmanId}`);
      socket.emit('join:salesman', salesmanId);
    });

    // Periodic Heartbeat every 25 seconds
    const heartbeatInterval = setInterval(async () => {
      if (socket.connected) {
        const battery = await getDeviceBattery();
        socket.emit('salesman:heartbeat', {
          salesmanId,
          battery,
          timestamp: new Date(),
        });
      }
    }, 25000);

    return () => {
      clearInterval(heartbeatInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [adminInfo?.token, isSalesman, salesmanId]);

  // Background GPS Position Tracking
  useEffect(() => {
    if (!isSalesman || !salesmanId) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const handlePosition = async (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const accuracy = Math.round(pos.coords.accuracy);
      const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
      const heading = Math.round(pos.coords.heading || 0);

      setGpsActive(true);

      const now = Date.now();
      const timeElapsed = now - lastSyncTimeRef.current;

      // Distance moved in meters (simple approximation)
      const distLat = Math.abs(lat - lastCoordsRef.current.lat) * 111000;
      const distLng = Math.abs(lng - lastCoordsRef.current.lng) * 111000 * Math.cos((lat * Math.PI) / 180);
      const approxDist = Math.sqrt(distLat * distLat + distLng * distLng);

      // Broadcast if 20 seconds passed OR moved >= 15 meters
      if (timeElapsed >= 20000 || approxDist >= 15) {
        lastSyncTimeRef.current = now;
        lastCoordsRef.current = { lat, lng };

        const battery = await getDeviceBattery();
        const payload = {
          salesmanId,
          salesmanName: adminInfo?.name || 'Salesman',
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading,
          battery,
        };

        // 1. Send through Socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('salesman:location:update', payload);
        }

        // 2. Throttle REST API every 40 seconds for resilience
        if (now - lastRestTimeRef.current >= 40000) {
          lastRestTimeRef.current = now;
          SalesmanVisitServices.updateLocationRest(payload).catch(() => {});
        }
      }
    };

    const handleError = (err) => {
      console.warn('[SalesmanTracker] Geolocation notice:', err.message);
      setGpsActive(false);
    };

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    });
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [adminInfo?.name, isSalesman, salesmanId]);

  // If not salesman, render nothing
  if (!isSalesman) return null;

  // Unobtrusive subtle pill in bottom-right corner informing salesman that tracking is live
  return (
    <div className="fixed bottom-3 right-3 z-40 pointer-events-none">
      <div className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-1.5 opacity-75 hover:opacity-100 transition">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Salesman Live {gpsActive ? '• GPS Active' : '• Connected'}</span>
      </div>
    </div>
  );
};

export default SalesmanPresenceTracker;
