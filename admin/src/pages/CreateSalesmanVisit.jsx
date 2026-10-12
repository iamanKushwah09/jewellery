import React, { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiSave,
  FiArrowLeft,
  FiMapPin,
  FiDollarSign,
  FiUser,
  FiShoppingBag,
  FiFileText,
  FiClock,
} from 'react-icons/fi';
import { AdminContext } from '@/context/AdminContext';
import SalesmanServices from '@/services/SalesmanServices';
import CustomerServices from '@/services/CustomerServices';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { notifySuccess, notifyError } from '@/utils/toast';
import CameraPhotoInput from '@/components/common/CameraPhotoInput';
import LocationCaptureCard from '@/components/common/LocationCaptureCard';

const PURPOSE_PRESETS = [
  '🛒 Order Booking',
  '💰 Payment Collection',
  '📦 Stock / Display Check',
  '🤝 New Party Introduction',
  '📍 Routine Visit & Follow-up',
];

const CreateSalesmanVisit = () => {
  const history = useHistory();
  const location = useLocation();
  const { id: editVisitId } = useParams();

  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  // Query params if launched from a Route: ?routeId=...&partyId=...&salesmanId=...
  const queryParams = new URLSearchParams(location.search);
  const routeIdParam = queryParams.get('routeId');
  const partyIdParam = queryParams.get('partyId');
  const salesmanIdParam = queryParams.get('salesmanId');

  const [salesmen, setSalesmen] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [salesman, setSalesman] = useState(
    adminInfo?.salesman_id || salesmanIdParam || ''
  );
  const [visitDate, setVisitDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [party, setParty] = useState(partyIdParam || '');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [checkInTime, setCheckInTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [checkOutTime, setCheckOutTime] = useState('');
  const [photo, setPhoto] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [status, setStatus] = useState('Pending');

  // GPS Location State (used with LocationCaptureCard)
  const [gpsLocation, setGpsLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: '',
    loading: false,
    error: null,
  });

  // Reverse geocode using Google Maps server API with resilient fallbacks
  const reverseGeocodeFast = async (lat, lng) => {
    try {
      const data = await SalesmanVisitServices.reverseGeocode(lat, lng);
      if (data?.success && data?.address) {
        return data.address;
      }
    } catch (e) {
      console.warn('Google Maps geocoding failed, trying fallback...', e?.message);
    }

    // Free fallback: BigDataCloud
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.locality,
          data.city || data.localityInfo?.administrative?.[2]?.name,
          data.principalSubdivision,
          data.countryName,
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    } catch (e) {}

    return `📍 Lat: ${lat}, Lng: ${lng} (Live GPS Tagged)`;
  };

  // Capture GPS using device fix with fallback to network IP location
  const captureGPS = async () => {
    setGpsLocation({
      latitude: null,
      longitude: null,
      accuracy: null,
      address: '',
      loading: true,
      error: null,
    });

    const fallbackToNetworkLocation = async () => {
      try {
        const netRes = await fetch(
          'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en'
        );
        if (netRes.ok) {
          const netData = await netRes.json();
          if (netData.latitude && netData.longitude) {
            const netLat = Number(netData.latitude.toFixed(6));
            const netLng = Number(netData.longitude.toFixed(6));
            const parts = [
              netData.locality,
              netData.city || netData.localityInfo?.administrative?.[2]?.name,
              netData.principalSubdivision,
              netData.countryName,
            ].filter(Boolean);
            const netAddr = parts.join(', ') || `Lat: ${netLat}, Lng: ${netLng}`;

            setGpsLocation({
              latitude: netLat,
              longitude: netLng,
              accuracy: 250,
              address: netAddr,
              loading: false,
              error: null,
            });
            return true;
          }
        }
      } catch (e) {
        console.warn('Network location fallback error:', e);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await fallbackToNetworkLocation();
      if (!ok) {
        setGpsLocation((prev) => ({
          ...prev,
          loading: false,
          error: 'Geolocation is not supported by your browser.',
        }));
      }
      return;
    }

    let resolved = false;

    // Safety timeout: If GPS takes > 7 seconds on laptop or indoors, auto-lock network location
    const fallbackTimer = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        console.log('[GPS] Slow fix on this device, auto-locking network location...');
        const ok = await fallbackToNetworkLocation();
        if (!ok) {
          setGpsLocation((prev) => ({
            ...prev,
            loading: false,
            error: 'GPS acquisition timed out. Please allow device location or enter address.',
          }));
        }
      }
    }, 7000);

    const finalizePosition = async (pos) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(fallbackTimer);

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy);

      setGpsLocation({
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        address: 'Resolving live address...',
        loading: false,
        error: null,
      });

      const addr = await reverseGeocodeFast(lat, lng);
      setGpsLocation((prev) => ({
        ...prev,
        address: addr,
      }));
    };

    // Try high accuracy with cached fix allowance
    navigator.geolocation.getCurrentPosition(
      finalizePosition,
      async () => {
        // High accuracy failed or timed out (common on PCs) -> try standard coarse location
        navigator.geolocation.getCurrentPosition(
          finalizePosition,
          async (coarseErr) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(fallbackTimer);
            const ok = await fallbackToNetworkLocation();
            if (!ok) {
              setGpsLocation((prev) => ({
                ...prev,
                loading: false,
                error: `GPS Error: ${coarseErr?.message || 'Unavailable'}. Please check permissions.`,
              }));
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  };

  // Auto-acquire GPS on page load when creating a new visit
  useEffect(() => {
    if (!editVisitId) {
      captureGPS();
    }
  }, [editVisitId]);

  // Load Salesmen and Parties dropdowns
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [salesmenRes, customersRes] = await Promise.all([
          SalesmanServices.getAllSalesman({ limit: 100 }),
          CustomerServices.getAllCustomer({ limit: 300 }),
        ]);

        if (salesmenRes?.salesmans) {
          setSalesmen(salesmenRes.salesmans);

          // If logged in as salesman, auto-resolve their salesman ID if not already set
          if (isSalesman && !salesman) {
            const myEmail = adminInfo?.email?.toLowerCase();
            const myName =
              typeof adminInfo?.name === 'object'
                ? adminInfo.name.en || Object.values(adminInfo.name)[0]
                : adminInfo?.name;

            const match = salesmenRes.salesmans.find(
              (s) =>
                (myEmail && s.email && s.email.toLowerCase() === myEmail) ||
                (myName && s.name && s.name.toLowerCase() === myName.toLowerCase())
            );
            if (match) {
              setSalesman(match._id);
            }
          }
        }

        if (customersRes?.customers) {
          setParties(customersRes.customers);
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };

    loadDropdownData();
  }, [isSalesman, adminInfo]);

  // If in edit mode, fetch existing visit
  useEffect(() => {
    if (!editVisitId) return;
    const fetchExisting = async () => {
      try {
        setLoading(true);
        const data = await SalesmanVisitServices.getVisitById(editVisitId);
        if (data) {
          setSalesman(data.salesman?._id || data.salesman || '');
          setParty(data.party?._id || data.party || '');
          setVisitDate(dayjs(data.visitDate).format('YYYY-MM-DD'));
          setPurpose(data.purpose || '');
          setNotes(data.notes || '');
          setGpsLocation({
            latitude: data.location?.latitude || null,
            longitude: data.location?.longitude || null,
            accuracy: data.location?.accuracy || null,
            address: data.location?.address || '',
            loading: false,
            error: null,
          });
          if (data.checkInTime) setCheckInTime(dayjs(data.checkInTime).format('YYYY-MM-DDTHH:mm'));
          if (data.checkOutTime) setCheckOutTime(dayjs(data.checkOutTime).format('YYYY-MM-DDTHH:mm'));
          setPhoto(data.photo || data.inPhoto || '');
          setCollectionAmount(data.collection || data.collectionAmount || '');
          setCollectionNotes(data.collectionNotes || '');
          setStatus(data.status || 'Pending');
        }
      } catch (err) {
        console.error('Failed to fetch visit for edit:', err);
        notifyError('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };
    fetchExisting();
  }, [editVisitId]);

  // Find currently selected party details for helpful context
  const selectedPartyObj = parties.find((p) => p._id === party);
  const selectedPartyAddress =
    selectedPartyObj?.address ||
    (typeof selectedPartyObj?.shippingAddress === 'object'
      ? selectedPartyObj.shippingAddress?.address || selectedPartyObj.shippingAddress?.city
      : selectedPartyObj?.shippingAddress) ||
    '';
  const selectedPartyPhone = selectedPartyObj?.phone || selectedPartyObj?.contact || '';

  // Get current logged-in salesman display name
  const salesmanDisplayName =
    (typeof adminInfo?.name === 'object'
      ? adminInfo.name.en || Object.values(adminInfo.name)[0]
      : adminInfo?.name) ||
    adminInfo?.email?.split('@')[0] ||
    'Salesman';

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalSalesman = salesman;
    if (isSalesman) {
      finalSalesman = adminInfo?.salesman_id || salesman;
      if (!finalSalesman && salesmen.length > 0) {
        const myEmail = adminInfo?.email?.toLowerCase();
        const myName =
          typeof adminInfo?.name === 'object'
            ? adminInfo.name.en || Object.values(adminInfo.name)[0]
            : adminInfo?.name;

        const match = salesmen.find(
          (s) =>
            (myEmail && s.email && s.email.toLowerCase() === myEmail) ||
            (myName && s.name && s.name.toLowerCase() === myName.toLowerCase())
        );
        if (match) finalSalesman = match._id;
      }
    }

    if (!isSalesman && !finalSalesman) {
      notifyError('Please select a salesman');
      return;
    }

    if (!party) {
      notifyError('Please select a party/customer to visit');
      return;
    }

    if (!purpose.trim()) {
      notifyError('Please enter or select the purpose of this visit');
      return;
    }

    try {
      setLoading(true);

      // Status logic: If salesman submitted with photo, set to In Progress; else Pending
      let finalStatus = status;
      if (isSalesman && !editVisitId) {
        finalStatus = photo ? 'In Progress' : 'Pending';
      }

      const payload = {
        salesman: finalSalesman,
        party,
        route: routeIdParam || null,
        visitDate,
        purpose: purpose.trim(),
        notes: notes.trim(),
        location: {
          address: gpsLocation.address || '',
          latitude: gpsLocation.latitude != null ? Number(gpsLocation.latitude) : null,
          longitude: gpsLocation.longitude != null ? Number(gpsLocation.longitude) : null,
          accuracy: gpsLocation.accuracy != null ? Number(gpsLocation.accuracy) : null,
        },
        checkInTime: checkInTime ? new Date(checkInTime) : new Date(),
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        photo: photo || '',
        inPhoto: photo || '',
        collection: collectionAmount ? Number(collectionAmount) : 0,
        collectionNotes: collectionNotes || '',
        status: finalStatus,
      };

      if (editVisitId) {
        await SalesmanVisitServices.updateVisit(editVisitId, payload);
        notifySuccess('Visit details updated successfully');
      } else {
        await SalesmanVisitServices.createVisit(payload);
        notifySuccess('Visit created successfully!');
      }

      if (routeIdParam) {
        history.push('/salesman-routes');
      } else {
        history.push('/salesman-visits');
      }
    } catch (err) {
      console.error('Submit visit error:', err);
      notifyError(err.response?.data?.message || err.message || 'Failed to save visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>📍</span>
            {editVisitId
              ? 'Edit Salesman Visit'
              : routeIdParam
              ? 'Record Route Visit'
              : isSalesman
              ? 'Create New Party Visit'
              : 'Create Salesman Visit'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isSalesman
              ? 'Select party, choose purpose, capture live GPS location and photo proof.'
              : 'Record planned or ad-hoc party visit with GPS and collection details.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => history.goBack()}
          className="flex items-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs px-4 py-2 rounded transition shadow-sm"
        >
          <FiArrowLeft className="w-4 h-4" /> {routeIdParam ? 'Back to Routes' : 'Back'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {/* Salesman Profile Info (Salesman View vs Admin View) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-purple-200 dark:border-purple-900 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salesman Field */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Salesman <span className="text-red-500">*</span>
              </label>
              {isSalesman ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-200">
                  <FiUser className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs block truncate">{salesmanDisplayName}</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                      Logged-in Salesman Profile (Auto-tagged)
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={salesman}
                  onChange={(e) => setSalesman(e.target.value)}
                  required
                  className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
                >
                  <option value="">-- Select Salesman --</option>
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Visit Date */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          {/* Primary Party Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Party / Retailer Name <span className="text-red-500">*</span>
            </label>
            <select
              value={party}
              onChange={(e) => setParty(e.target.value)}
              required
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="">-- Choose Party to Visit ({parties.length} available) --</option>
              {parties.map((p) => {
                const name =
                  typeof p.name === 'object'
                    ? p.name.en || Object.values(p.name)[0]
                    : p.name;
                const city = p.city || p.address || '';
                return (
                  <option key={p._id} value={p._id}>
                    {name} {city ? `— [${city}]` : ''}
                  </option>
                );
              })}
            </select>

            {/* Selected Party Info Box */}
            {selectedPartyObj && (
              <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-[11px] text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                {selectedPartyPhone && (
                  <span>
                    <strong>📞 Phone:</strong> {selectedPartyPhone}
                  </span>
                )}
                {selectedPartyAddress && (
                  <span>
                    <strong>📍 Address:</strong> {selectedPartyAddress}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Purpose of Visit with Quick Preset Chips */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Purpose of Visit <span className="text-red-500">*</span>
            </label>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PURPOSE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPurpose(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium ${
                    purpose === preset
                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="E.g. Collected payment of ₹15,000, took new order for 20 units, checked stock..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Any remarks, next visit date, party request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Admin-only Timing & Status Control */}
          {!isSalesman && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Check-In Time
                </label>
                <input
                  type="datetime-local"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Check-Out Time
                </label>
                <input
                  type="datetime-local"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2.5 py-1.5"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Live Location GPS Card (Google Maps Geocoding via Server + Satellite GPS) */}
        <LocationCaptureCard
          gpsLocation={gpsLocation}
          setGpsLocation={setGpsLocation}
          onRefreshGPS={captureGPS}
          colorScheme="emerald"
        />

        {/* Photo Capture Section (Live Device Camera + File picker) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-purple-200 dark:border-purple-900">
          <CameraPhotoInput
            photo={photo}
            onPhotoChange={setPhoto}
            label="Visit Photo Proof (Optional on Creation)"
            required={false}
            helperText="Click photo live with camera or choose from gallery. You can also take arrival photo later during Check-In."
            colorScheme="purple"
          />
        </div>

        {/* Payment Collection (Optional) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-amber-200 dark:border-amber-900/60 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
            <FiDollarSign className="w-4 h-4" /> Payment Collection (Optional)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Collection Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                  className="w-full text-xs md:text-sm pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Leave empty if no money received</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Payment Mode / Notes
              </label>
              <input
                type="text"
                placeholder="Cash, Cheque #, UPI Ref, etc."
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                className="w-full text-xs md:text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : editVisitId ? 'Save Visit Details' : 'Create & Record Visit'}
          </button>
          <button
            type="button"
            onClick={() => history.goBack()}
            className="flex items-center gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-xs md:text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSalesmanVisit;
