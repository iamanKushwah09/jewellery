import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  FiSearch,
  FiMapPin,
  FiRadio,
  FiNavigation,
  FiActivity,
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiUserCheck,
} from 'react-icons/fi';
import { AdminContext } from '@/context/AdminContext';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { notifyError, notifySuccess } from '@/utils/toast';

dayjs.extend(relativeTime);

// Custom Leaflet marker generator
const createCustomMarkerIcon = (status, name, isSelf = false) => {
  let color = '#10b981'; // Live: emerald
  let statusText = 'LIVE';

  if (status === 'stale') {
    color = '#f59e0b'; // Stale: amber
    statusText = 'STALE';
  } else if (status === 'offline') {
    color = '#ef4444'; // Offline: red
    statusText = 'OFFLINE';
  }

  const isLive = status === 'live';
  const label = isSelf ? `📍 You (${name || 'Me'})` : (name || 'Salesman');

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto; transform: translate(-50%, -100%);">
      <div style="background: rgba(15, 23, 42, 0.92); color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; margin-bottom: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; gap: 4px;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
        <span>${label}</span>
      </div>
      <div style="position: relative; width: 34px; height: 34px;">
        ${isLive ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid #ffffff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
      <div style="width: 2px; height: 7px; background: ${color}; margin-top: -1px;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-salesman-div-marker',
    html,
    iconSize: [34, 58],
    iconAnchor: [17, 58],
    popupAnchor: [0, -60],
  });
};

const SalesmanTracking = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  const [effectiveSalesmanId, setEffectiveSalesmanId] = useState(adminInfo?.salesman_id || null);

  // Map & Visualizer Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const accuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastRestSyncTimeRef = useRef(0);

  // Tracking Data State
  const [salesmen, setSalesmen] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [todaySummary, setTodaySummary] = useState({
    totalSalesmen: 0,
    activeNow: 0,
    staleCount: 0,
    offlineCount: 0,
    todayVisitsCount: 0,
    todayTotalCollection: 0,
  });
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRouteSalesman, setActiveRouteSalesman] = useState(null);
  const [routePointsCount, setRoutePointsCount] = useState(0);

  // Salesman live device GPS broadcasting state
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [myGpsInfo, setMyGpsInfo] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: 0,
    heading: 0,
    battery: null,
    timestamp: null,
  });

  // Query device battery percentage if supported
  const getDeviceBattery = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const battery = await navigator.getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (e) {
      // not supported
    }
    return null;
  };

  // Resolve salesmanId fallback if missing in token
  useEffect(() => {
    if (adminInfo?.salesman_id) {
      setEffectiveSalesmanId(adminInfo.salesman_id);
    } else if (isSalesman) {
      // Fallback: fetch live locations to find self ID matching email or name
      SalesmanVisitServices.getLiveLocations()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setEffectiveSalesmanId(data[0].salesmanId);
          }
        })
        .catch(() => {});
    }
  }, [adminInfo, isSalesman]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: India (Lat: 28.6139, Lng: 77.2090)
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090],
      zoom: 12,
      zoomControl: true,
      fadeAnimation: true,
    });

    // Google Maps Roadmap layer (Default high-resolution streets & landmarks)
    const googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    });

    // Google Maps Satellite Hybrid layer
    const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps Satellite',
    });

    // OpenStreetMap Fallback layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    // Default to Google Maps
    googleRoadmap.addTo(map);

    // Add layer switcher control
    L.control.layers(
      {
        'Google Maps (Roadmap)': googleRoadmap,
        'Google Satellite (Hybrid)': googleHybrid,
        'OpenStreetMap': osmLayer,
      },
      null,
      { position: 'topright' }
    ).addTo(map);

    mapRef.current = map;

    // Invalidate size to ensure seamless tile layout
    const resizeTimer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    const handleWindowResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleWindowResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Popup HTML builder with production-grade styling
  const buildPopupHtml = useCallback((s) => {
    const isLive = s.trackingStatus === 'live';
    const isStale = s.trackingStatus === 'stale';
    const statusBg = isLive ? '#10b981' : isStale ? '#f59e0b' : '#ef4444';
    const statusLabel = (s.trackingStatus || 'offline').toUpperCase();
    const updatedText = s.lastSeenAt ? dayjs(s.lastSeenAt).fromNow() : 'No updates today';

    return `
      <div style="min-width: 220px; font-family: inherit; font-size: 12px; color: #1e293b; padding: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
          <h4 style="margin: 0; font-weight: 700; font-size: 13px; color: #0f172a;">${s.name || 'Salesman'}</h4>
          <span style="background: ${statusBg}; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">
            ${statusLabel}
          </span>
        </div>
        <div style="space-y: 2px; line-height: 1.45;">
          <p style="margin: 2px 0; color: #334155;"><strong>📍 Location:</strong> ${s.address || 'GPS Coordinates Detected'}</p>
          <p style="margin: 2px 0; color: #475569;"><strong>Coordinates:</strong> ${Number(s.latitude).toFixed(5)}, ${Number(s.longitude).toFixed(5)}</p>
          <p style="margin: 2px 0; color: #475569;"><strong>Accuracy:</strong> ${s.accuracy ? s.accuracy + 'm' : 'GPS standard'}</p>
          <p style="margin: 2px 0; color: #475569;"><strong>Speed:</strong> ${s.speed ? s.speed + ' km/h' : '0 km/h'}</p>
          ${s.battery != null ? `<p style="margin: 2px 0; color: #475569;"><strong>Device Battery:</strong> ${s.battery}%</p>` : ''}
          ${s.visitsToday != null ? `<p style="margin: 2px 0; color: #2563eb;"><strong>Visits Today:</strong> ${s.visitsToday}</p>` : ''}
          ${s.collection != null ? `<p style="margin: 2px 0; color: #7e22ce;"><strong>Collected:</strong> ₹ ${Number(s.collection).toLocaleString()}</p>` : ''}
          <p style="margin: 4px 0 0; color: #64748b; font-size: 11px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
            <strong>Last Ping:</strong> ${updatedText}
          </p>
        </div>
      </div>
    `;
  }, []);

  // Synchronize Leaflet markers with salesmen list
  const syncMarkersOnMap = useCallback((list) => {
    if (!mapRef.current) return;

    const bounds = [];

    list.forEach((s) => {
      const id = s.salesmanId?.toString() || s._id?.toString();
      if (!id || s.latitude == null || s.longitude == null) return;

      const lat = Number(s.latitude);
      const lng = Number(s.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      bounds.push([lat, lng]);

      const isSelf = isSalesman && effectiveSalesmanId && id === effectiveSalesmanId.toString();
      const icon = createCustomMarkerIcon(s.trackingStatus, s.name, isSelf);

      if (markersRef.current[id]) {
        // Smoothly update existing marker coordinate & popup
        const marker = markersRef.current[id];
        marker.setLatLng([lat, lng]);
        marker.setIcon(icon);
        marker.setPopupContent(buildPopupHtml(s));
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
        marker.bindPopup(buildPopupHtml(s));
        marker.on('click', () => {
          setSelectedSalesman(s);
        });
        markersRef.current[id] = marker;
      }
    });

    // Auto-fit map to all active markers if bounds exist
    if (bounds.length > 0 && mapRef.current) {
      try {
        if (bounds.length === 1) {
          mapRef.current.setView(bounds[0], 15);
        } else {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (e) {
        // fallback
      }
    }
  }, [buildPopupHtml, effectiveSalesmanId, isSalesman]);

  // Fetch initial live locations and summary via REST
  const loadInitialData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const [locationsRes, summaryRes] = await Promise.all([
        SalesmanVisitServices.getLiveLocations(),
        SalesmanVisitServices.getTodaySummary(),
      ]);

      if (Array.isArray(locationsRes)) {
        setSalesmen(locationsRes);
        syncMarkersOnMap(locationsRes);
      }
      if (summaryRes) {
        setTodaySummary(summaryRes);
      }
    } catch (err) {
      console.error('Failed to load live tracking data:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [syncMarkersOnMap]);

  // Initial load
  useEffect(() => {
    loadInitialData(false);
  }, [loadInitialData]);

  // Production Resilience: Fallback Polling every 15s + Window Focus refresh
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Background silent refresh
      loadInitialData(true);
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadInitialData(true);
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadInitialData]);

  // Socket.IO real-time subscriptions
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_APP_API_SOCKET_URL || 'http://localhost:5055';
    const socket = io(socketUrl, {
      auth: {
        token: adminInfo?.token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Tracking Socket.IO gateway');
      socket.emit('join:admin_tracking');
      if (isSalesman && effectiveSalesmanId) {
        socket.emit('join:salesman', effectiveSalesmanId);
      }
    });

    // Handle real-time location update broadcast
    socket.on('admin:location:update', (data) => {
      const { salesmanId, latitude, longitude, trackingStatus, address, speed, accuracy, heading, battery, lastSeenAt, salesmanName } = data;

      // If logged in as salesman, ignore pings from other salesmen
      if (isSalesman && effectiveSalesmanId && salesmanId?.toString() !== effectiveSalesmanId?.toString()) {
        return;
      }

      setSalesmen((prevList) => {
        let exists = false;
        const updatedList = prevList.map((item) => {
          const id = item.salesmanId?.toString() || item._id?.toString();
          if (id === salesmanId?.toString()) {
            exists = true;
            return {
              ...item,
              latitude,
              longitude,
              accuracy: accuracy || item.accuracy,
              speed: speed || item.speed,
              heading: heading || item.heading,
              battery: battery ?? item.battery,
              address: address || item.address,
              trackingStatus: trackingStatus || 'live',
              lastSeenAt: lastSeenAt || new Date(),
              isOnline: true,
            };
          }
          return item;
        });

        if (!exists) {
          updatedList.push({
            salesmanId,
            name: salesmanName || 'Salesman',
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            battery,
            address,
            trackingStatus: 'live',
            lastSeenAt: lastSeenAt || new Date(),
            isOnline: true,
          });
        }

        return updatedList;
      });

      // Update marker in Leaflet without recreating map
      if (mapRef.current && latitude && longitude) {
        const id = salesmanId.toString();
        const isSelf = isSalesman && effectiveSalesmanId && id === effectiveSalesmanId.toString();
        const icon = createCustomMarkerIcon(trackingStatus || 'live', salesmanName || 'Salesman', isSelf);
        const sObj = {
          name: salesmanName,
          salesmanId,
          latitude,
          longitude,
          accuracy,
          speed,
          battery,
          address,
          trackingStatus: trackingStatus || 'live',
          lastSeenAt,
        };

        if (markersRef.current[id]) {
          const m = markersRef.current[id];
          m.setLatLng([latitude, longitude]);
          m.setIcon(icon);
          m.setPopupContent(buildPopupHtml(sObj));
        } else {
          const m = L.marker([latitude, longitude], { icon }).addTo(mapRef.current);
          m.bindPopup(buildPopupHtml(sObj));
          m.on('click', () => setSelectedSalesman(sObj));
          markersRef.current[id] = m;
        }
      }
    });

    // Handle salesman status change (live -> stale -> offline)
    socket.on('admin:salesman:status', (data) => {
      const { salesmanId, trackingStatus } = data;
      setSalesmen((prev) =>
        prev.map((s) => {
          const id = s.salesmanId?.toString() || s._id?.toString();
          if (id === salesmanId?.toString()) {
            return { ...s, trackingStatus, isOnline: trackingStatus !== 'offline' };
          }
          return s;
        })
      );

      if (markersRef.current[salesmanId?.toString()]) {
        const m = markersRef.current[salesmanId.toString()];
        const s = salesmen.find((item) => (item.salesmanId?.toString() || item._id?.toString()) === salesmanId.toString());
        const isSelf = isSalesman && effectiveSalesmanId && salesmanId.toString() === effectiveSalesmanId.toString();
        m.setIcon(createCustomMarkerIcon(trackingStatus, s?.name, isSelf));
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [adminInfo, buildPopupHtml, effectiveSalesmanId, isSalesman, salesmen]);

  // Start Salesman Device Live GPS Broadcasting
  const startGpsSharing = async () => {
    if (!navigator.geolocation) {
      notifyError('Geolocation is not supported by your browser.');
      return;
    }

    const initialBattery = await getDeviceBattery();

    setIsBroadcastingGps(true);
    notifySuccess('Live GPS broadcast active! Broadcaster started.');

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
        const heading = pos.coords.heading || 0;
        const currentBattery = await getDeviceBattery() || initialBattery;

        setMyGpsInfo({
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading,
          battery: currentBattery,
          timestamp: new Date(),
        });

        // 1. WebSocket Broadcast to Admin Fleet Room
        if (socketRef.current && effectiveSalesmanId) {
          socketRef.current.emit('salesman:location:update', {
            salesmanId: effectiveSalesmanId,
            salesmanName: adminInfo?.name || 'Salesman',
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            heading,
            battery: currentBattery,
          });
        }

        // 2. REST Fallback (throttle every 25 seconds for reliability across battery-saving modes)
        const nowMs = Date.now();
        if (effectiveSalesmanId && nowMs - lastRestSyncTimeRef.current >= 25000) {
          lastRestSyncTimeRef.current = nowMs;
          SalesmanVisitServices.updateLocationRest({
            salesmanId: effectiveSalesmanId,
            salesmanName: adminInfo?.name || 'Salesman',
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            heading,
            battery: currentBattery,
          }).catch(() => {});
        }

        // 3. Update self marker and accuracy circle on Map
        if (mapRef.current) {
          // Accuracy radius circle
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng([lat, lng]);
            accuracyCircleRef.current.setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle([lat, lng], {
              radius: accuracy,
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(mapRef.current);
          }

          mapRef.current.setView([lat, lng], 16);
        }
      },
      (err) => {
        console.error('GPS Watch error:', err);
        notifyError('Could not retrieve GPS: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;
  };

  // Stop Salesman Device GPS Broadcasting
  const stopGpsSharing = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (accuracyCircleRef.current && mapRef.current) {
      mapRef.current.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
    setIsBroadcastingGps(false);
    notifySuccess('Live GPS broadcast stopped.');
  };

  // Clean watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Center/Fly-To Salesman on Map
  const handleFocusSalesman = (salesman) => {
    setSelectedSalesman(salesman);
    if (!mapRef.current || !salesman.latitude || !salesman.longitude) return;

    mapRef.current.flyTo([salesman.latitude, salesman.longitude], 16, {
      duration: 1.2,
    });

    const id = salesman.salesmanId?.toString() || salesman._id?.toString();
    if (markersRef.current[id]) {
      markersRef.current[id].openPopup();
    }
  };

  // View Salesman Today's Route History Polyline
  const handleViewRoute = async (salesman) => {
    try {
      const id = salesman.salesmanId?.toString() || salesman._id?.toString();
      setActiveRouteSalesman(salesman.name);

      const history = await SalesmanVisitServices.getLocationHistory(id);

      if (!history || !Array.isArray(history) || history.length === 0) {
        notifyError(`No GPS breadcrumb coordinates recorded for ${salesman.name} today.`);
        return;
      }

      // Remove existing polyline if any
      if (routePolylineRef.current && mapRef.current) {
        mapRef.current.removeLayer(routePolylineRef.current);
      }

      const latlngs = history
        .filter((h) => h.latitude && h.longitude)
        .map((h) => [h.latitude, h.longitude]);

      if (latlngs.length === 0) {
        notifyError('Route coordinates are empty.');
        return;
      }

      setRoutePointsCount(latlngs.length);

      const polyline = L.polyline(latlngs, {
        color: '#7e22ce', // Purple
        weight: 4.5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(mapRef.current);

      routePolylineRef.current = polyline;

      mapRef.current.fitBounds(polyline.getBounds(), { padding: [45, 45] });
      notifySuccess(`Route loaded: ${latlngs.length} tracking points mapped.`);
    } catch (err) {
      console.error('Error fetching route history:', err);
      notifyError('Failed to fetch route history.');
    }
  };

  // Clear polyline
  const handleClearRoute = () => {
    if (routePolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    setActiveRouteSalesman(null);
    setRoutePointsCount(0);
  };

  // Filtered salesmen list
  const filteredSalesmen = salesmen.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : s.trackingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-5 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Inject styling for custom DivIcon */}
      <style>{`
        .custom-salesman-div-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 shadow-sm">
            <FiRadio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              {isSalesman ? 'My Live Route & GPS Tracker' : 'Sales Fleet Real-Time Radar'}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                LIVE SYNC
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {isSalesman
                ? 'Broadcast device location and track your customer visit trail in real-time'
                : 'Live GPS location tracking of active salesmen across field routes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRouteSalesman && (
            <button
              onClick={handleClearRoute}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg font-medium transition"
            >
              Clear Route ({activeRouteSalesman} — {routePointsCount} pts)
            </button>
          )}
          <button
            onClick={() => loadInitialData(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-lg font-semibold transition shadow-sm disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {!isSalesman ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Fleet</span>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                  {todaySummary.totalSalesmen}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                <FiUserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Now
                </span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">
                  {todaySummary.activeNow}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                <FiRadio className="w-5 h-5" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center justify-between col-span-2">
              <div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isBroadcastingGps ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`}></span>
                  Broadcast Status
                </span>
                <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                  {isBroadcastingGps ? 'Broadcasting Live GPS' : 'Idle (Click Start Broadcast)'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                <FiRadio className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Today Visits</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {todaySummary.todayVisitsCount}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-purple-200 dark:border-purple-800/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Total Collected</span>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">
              ₹ {Number(todaySummary.todayTotalCollection || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30">
            <FiActivity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) and Control Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Left Column: Leaflet Map Container */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[540px]">
            {/* Map Header Bar */}
            <div className="bg-slate-900 text-white px-4 py-2.5 font-semibold text-xs sm:text-sm flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-emerald-400" />
                <span>Live Interactive Radar</span>
              </span>
              <div className="flex items-center gap-3 text-xs font-normal">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Live (&lt;30s)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Stale (&lt;2m)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Offline
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-800">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                    <FiRefreshCw className="w-5 h-5 animate-spin" /> Synchronizing radar & GPS...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: GPS Broadcaster (Salesman) or Fleet Radar List (Admin) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          {/* Card 1: Broadcaster for Salesman */}
          {isSalesman ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="bg-emerald-600 text-white px-4 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiRadio className={`w-4 h-4 ${isBroadcastingGps ? 'animate-pulse text-emerald-200' : ''}`} />
                  Device GPS Broadcaster
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isBroadcastingGps ? 'bg-emerald-900 text-emerald-100' : 'bg-gray-700 text-gray-200'}`}>
                  {isBroadcastingGps ? 'ONLINE' : 'STOPPED'}
                </span>
              </div>
              <div className="p-3.5 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Toggle live location sharing. Coordinates update every 5-15 seconds for admin dispatch & route tracking.
                </p>

                {isBroadcastingGps ? (
                  <button
                    type="button"
                    onClick={stopGpsSharing}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <FiXCircle className="w-4 h-4" /> Stop Live GPS Broadcast
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGpsSharing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <FiRadio className="w-4 h-4 animate-pulse" /> Start Live GPS Broadcast
                  </button>
                )}

                {myGpsInfo.latitude && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-xs space-y-1.5 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Coordinates:</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">
                        {myGpsInfo.latitude.toFixed(5)}, {myGpsInfo.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>GPS Accuracy:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ±{myGpsInfo.accuracy} meters
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Live Speed:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{myGpsInfo.speed} km/h</span>
                    </div>
                    {myGpsInfo.battery != null && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Device Battery:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{myGpsInfo.battery}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-purple-700 text-white px-4 py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2">
                <FiSearch className="w-4 h-4" /> Search Sales Fleet
              </div>
              <div className="p-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search salesman by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-purple-600"
                  />
                  <FiSearch className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Active Salesmen List (Admin) or Self Location Card (Salesman) */}
          {!isSalesman ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-1 max-h-[300px]">
              <div className="bg-slate-800 text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FiActivity className="w-3.5 h-3.5 text-emerald-400" /> Online Fleet Roster
                </span>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full">
                  {salesmen.filter((s) => s.trackingStatus === 'live').length} Active
                </span>
              </div>

              <div className="p-2.5 overflow-y-auto space-y-1.5 flex-1 divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredSalesmen.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No salesmen matched search filter
                  </div>
                ) : (
                  filteredSalesmen.map((s) => {
                    const status = s.trackingStatus || 'offline';
                    const isLive = status === 'live';
                    const isStale = status === 'stale';

                    return (
                      <div
                        key={s.salesmanId || s._id}
                        onClick={() => handleFocusSalesman(s)}
                        className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-lg hover:bg-purple-50/70 dark:hover:bg-gray-700/60 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isLive
                                ? 'bg-emerald-500 animate-pulse'
                                : isStale
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          ></span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {s.name}
                            </p>
                            <p className="text-[10.5px] text-gray-400 truncate max-w-[170px]">
                              {s.address || (s.latitude ? `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}` : 'No GPS')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocusSalesman(s);
                            }}
                            title="Focus on Map"
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded transition"
                          >
                            <FiNavigation className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRoute(s);
                            }}
                            title="View Today's Route"
                            className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded transition"
                          >
                            <FiMapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 space-y-2.5">
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-purple-600" /> Today's Field Route History
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can review the path you travelled today with all recorded visit waypoints.
              </p>
              {salesmen.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleViewRoute(salesmen[0])}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FiNavigation className="w-3.5 h-3.5" /> Draw My Path on Map
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Table: Sales Fleet Live Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-purple-700 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">
              {isSalesman ? 'My Live Coordinates & Today Status' : 'Sales Fleet Live Status & Daily Metrics'}
            </h3>
          </div>
          {!isSalesman && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1 text-xs bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All ({salesmen.length})</option>
                <option value="live">Live</option>
                <option value="stale">Stale</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                {!isSalesman && <th className="p-3">Salesman</th>}
                <th className="p-3">Current Location</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Status</th>
                <th className="p-3">Visits Today</th>
                <th className="p-3">Collected Today</th>
                <th className="p-3">Last Ping</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredSalesmen.length === 0 ? (
                <tr>
                  <td colSpan={isSalesman ? 7 : 8} className="p-6 text-center text-gray-400">
                    {isSalesman ? 'No location records found yet for your profile.' : 'No salesman records found'}
                  </td>
                </tr>
              ) : (
                filteredSalesmen.map((s) => {
                  const status = s.trackingStatus || 'offline';
                  const isLive = status === 'live';
                  const isStale = status === 'stale';

                  return (
                    <tr
                      key={s.salesmanId || s._id}
                      className="hover:bg-purple-50/50 dark:hover:bg-gray-700/40 transition"
                    >
                      {!isSalesman && (
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                          {s.name}
                        </td>
                      )}
                      <td className="p-3 text-gray-600 dark:text-gray-300 max-w-[220px] truncate">
                        {s.address || 'GPS Coordinates Recorded'}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 font-mono">
                        {s.latitude && s.longitude
                          ? `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`
                          : '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : isStale
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLive
                                ? 'bg-emerald-500 animate-pulse'
                                : isStale
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          ></span>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300 font-semibold">
                        {s.visitsToday != null ? s.visitsToday : '0'}
                      </td>
                      <td className="p-3 font-semibold text-purple-700 dark:text-purple-300">
                        ₹ {Number(s.collection || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">
                        {s.lastSeenAt ? dayjs(s.lastSeenAt).fromNow() : 'Never'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleFocusSalesman(s)}
                            title="Locate on map"
                            disabled={!s.latitude || !s.longitude}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FiNavigation className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleViewRoute(s)}
                            title="View today's route"
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded transition"
                          >
                            <FiMapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesmanTracking;
