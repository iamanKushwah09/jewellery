import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMapPin,
  FiClock,
  FiImage,
  FiX,
  FiLogIn,
  FiLogOut,
  FiCamera,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDollarSign,
  FiUpload,
} from 'react-icons/fi';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { AdminContext } from '@/context/AdminContext';
import { notifySuccess, notifyError } from '@/utils/toast';
import CameraPhotoInput from '@/components/common/CameraPhotoInput';
import LocationCaptureCard from '@/components/common/LocationCaptureCard';

const SalesmanVisits = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage] = useState(15);

  // Selected visit for View modal
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Check-In Modal State
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [inPhoto, setInPhoto] = useState('');
  const [inNotes, setInNotes] = useState('');
  const [inSubmitting, setInSubmitting] = useState(false);

  // Check-Out Modal State
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [checkOutTarget, setCheckOutTarget] = useState(null);
  const [outPhoto, setOutPhoto] = useState('');
  const [outNotes, setOutNotes] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [outSubmitting, setOutSubmitting] = useState(false);

  // Add Additional Photo Modal State
  const [addPhotoModalOpen, setAddPhotoModalOpen] = useState(false);
  const [addPhotoTarget, setAddPhotoTarget] = useState(null);
  const [additionalPhoto, setAdditionalPhoto] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  // GPS Location State (used in modals)
  const [gpsLocation, setGpsLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: '',
    loading: false,
    error: null,
  });

  // Photo Lightbox modal
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchVisits = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: resultsPerPage,
        search,
        status: statusFilter,
      };
      if (isSalesman && adminInfo?.salesman_id) {
        params.salesman = adminInfo.salesman_id;
      }
      const res = await SalesmanVisitServices.getAllVisits(params);
      setVisits(res.visits || []);
      setTotalResults(res.totalDoc || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load visits:', err);
      notifyError('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVisits(1, searchQuery);
  };

  const handleDeleteVisit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visit?')) return;
    try {
      await SalesmanVisitServices.deleteVisit(id);
      notifySuccess('Visit deleted successfully');
      fetchVisits(currentPage);
    } catch (err) {
      console.error('Failed to delete visit:', err);
      notifyError('Failed to delete visit');
    }
  };

  const handleOpenView = (visit) => {
    setSelectedVisit(visit);
    setShowViewModal(true);
  };

  // 🗺️ Industry-grade reverse geocoding: Google Maps API (via server) → Free fallbacks → GPS tag
  // Google Maps Geocoding API = 99%+ accurate addresses in India (street-level)
  // Server-side call keeps API key secure; free APIs as fallback if server is down
  const reverseGeocodeFast = async (lat, lng) => {
    // 1. PRIMARY: Google Maps Geocoding API via our server (most accurate)
    try {
      const data = await SalesmanVisitServices.reverseGeocode(lat, lng);
      if (data?.success && data?.address) {
        return data.address;
      }
    } catch (e) {
      console.warn('Google Maps geocoding failed, trying fallbacks...', e?.message);
    }

    // 2. FALLBACK: BigDataCloud (free, fast CDN, decent for India)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        clearTimeout(timeoutId);
        const parts = [
          data.locality,
          data.city || data.localityInfo?.administrative?.[2]?.name,
          data.principalSubdivision,
          data.countryName,
        ].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch (e) {
      // BigDataCloud aborted or network slow
    }

    // 3. FALLBACK: Nominatim OpenStreetMap
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { signal: controller.signal, headers: { 'User-Agent': 'FlipkartSyncAdmin/1.0' } }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (e) {
      // Network slow or offline
    }
    clearTimeout(timeoutId);

    // 4. ULTIMATE FALLBACK: Tagged coordinates (works even offline/2G)
    return `📍 Lat: ${lat}, Lng: ${lng} (Live GPS Tagged)`;
  };

  // Helper to fetch live device GPS with satellite lock & slow data resilience
  // Helper to fetch live device GPS with satellite lock & automatic network IP fallback
  const captureGPS = async () => {
    setGpsLocation({
      latitude: null,
      longitude: null,
      accuracy: null,
      address: '',
      loading: true,
      error: null,
    });

    // Fallback: network IP location (instant, works on PCs/laptops without satellite GPS chip)
    const fallbackToNetworkLocation = async () => {
      try {
        const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
        if (res.ok) {
          const d = await res.json();
          if (d.latitude && d.longitude) {
            const lat = Number(Number(d.latitude).toFixed(6));
            const lng = Number(Number(d.longitude).toFixed(6));
            const parts = [
              d.locality,
              d.city || d.localityInfo?.administrative?.[2]?.name,
              d.principalSubdivision,
              d.countryName,
            ].filter(Boolean);
            const addr = parts.join(', ') || `📍 Lat: ${lat}, Lng: ${lng}`;

            setGpsLocation({
              latitude: lat,
              longitude: lng,
              accuracy: 1000,
              address: addr,
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
          error: 'Geolocation is not supported by your browser. Please type address and click Locate.',
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
            error: 'GPS acquisition timed out. Type shop address below and click Locate.',
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

      const resolvedAddress = await reverseGeocodeFast(lat, lng);
      setGpsLocation((prev) => ({
        ...prev,
        address: resolvedAddress,
      }));
    };

    // Try high accuracy with 30-second cached fix allowance (locks in 100ms if already cached!)
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
                error: `GPS Error: ${coarseErr?.message || 'Unavailable'}. Type address below and click Locate.`,
              }));
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  };

  // -------------------------------------------------------------
  // CHECK-IN HANDLERS
  // -------------------------------------------------------------
  const handleOpenCheckIn = (visit) => {
    setCheckInTarget(visit);
    setInPhoto('');
    setInNotes('');
    setCheckInModalOpen(true);
    captureGPS();
  };

  const handleConfirmCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInTarget) return;

    if (!inPhoto) {
      notifyError('Please capture or upload the arrival ("In") photo');
      return;
    }

    try {
      setInSubmitting(true);
      const res = await SalesmanVisitServices.checkIn(checkInTarget._id, {
        inPhoto,
        location: {
          address: gpsLocation.address,
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          accuracy: gpsLocation.accuracy,
        },
        notes: inNotes,
      });

      notifySuccess(res.message || 'Check-In recorded successfully!');
      setCheckInModalOpen(false);
      setCheckInTarget(null);
      fetchVisits(currentPage);
      if (showViewModal && selectedVisit?._id === checkInTarget._id) {
        setSelectedVisit(res.data);
      }
    } catch (err) {
      console.error('Check-In error:', err);
      notifyError(err?.response?.data?.message || err?.message || 'Failed to check in');
    } finally {
      setInSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CHECK-OUT HANDLERS
  // -------------------------------------------------------------
  const handleOpenCheckOut = (visit) => {
    setCheckOutTarget(visit);
    setOutPhoto('');
    setOutNotes('');
    setCollectionAmount('');
    setCollectionNotes('');
    setCheckOutModalOpen(true);
    captureGPS();
  };

  const handleConfirmCheckOut = async (e) => {
    e.preventDefault();
    if (!checkOutTarget) return;

    if (!outPhoto) {
      notifyError('Please capture or upload the exit ("Out") photo');
      return;
    }

    try {
      setOutSubmitting(true);
      const res = await SalesmanVisitServices.checkOut(checkOutTarget._id, {
        outPhoto,
        location: {
          address: gpsLocation.address,
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          accuracy: gpsLocation.accuracy,
        },
        notes: outNotes,
        collectionAmount: collectionAmount ? Number(collectionAmount) : 0,
        collectionNotes: collectionNotes,
      });

      notifySuccess(res.message || 'Check-Out completed successfully!');
      setCheckOutModalOpen(false);
      setCheckOutTarget(null);
      fetchVisits(currentPage);
      if (showViewModal && selectedVisit?._id === checkOutTarget._id) {
        setSelectedVisit(res.data);
      }
    } catch (err) {
      console.error('Check-Out error:', err);
      notifyError(err?.response?.data?.message || err?.message || 'Failed to check out');
    } finally {
      setOutSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // ADD ADDITIONAL PHOTO HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddPhoto = (visit) => {
    setAddPhotoTarget(visit);
    setAdditionalPhoto('');
    setPhotoCaption('');
    setAddPhotoModalOpen(true);
    captureGPS();
  };

  const handleConfirmAddPhoto = async (e) => {
    e.preventDefault();
    if (!addPhotoTarget) return;

    if (!additionalPhoto) {
      notifyError('Please select or capture a photo to upload');
      return;
    }

    try {
      setPhotoSubmitting(true);
      const res = await SalesmanVisitServices.addPhoto(addPhotoTarget._id, {
        url: additionalPhoto,
        caption: photoCaption,
        address: gpsLocation.address,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: gpsLocation.accuracy,
      });

      notifySuccess('Photo uploaded successfully with location!');
      setAddPhotoModalOpen(false);
      setAddPhotoTarget(null);
      fetchVisits(currentPage);
      if (showViewModal && selectedVisit?._id === addPhotoTarget._id) {
        setSelectedVisit(res.visit);
      }
    } catch (err) {
      console.error('Add photo error:', err);
      notifyError(err?.response?.data?.message || err?.message || 'Failed to add photo');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Banner / Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>📍</span> {isSalesman ? 'My Assigned Visits' : 'Salesman Visits Management'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isSalesman
              ? 'Your assigned party visits. Check-in on arrival with In-Photo, upload site photos, and check-out with Out-Photo.'
              : 'Monitor salesman party visits, live check-in/out proofs, photo documentation, and collection amounts.'}
          </p>
        </div>
        <Link
          to="/salesman-visits/create"
          className="inline-flex items-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-sm self-start md:self-auto shrink-0"
        >
          <FiPlus className="w-4 h-4" /> {isSalesman ? '+ New Visit' : 'Create New Visit'}
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={isSalesman ? 'Search by Party or Purpose...' : 'Search by Salesman, Party, or Purpose...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-purple-600"
          >
            <option value="">-- All Status --</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm px-6 py-2 rounded transition shadow-sm"
          >
            <FiSearch className="w-4 h-4" /> Search
          </button>
        </form>
      </div>

      {/* Visits List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-900 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Visits List
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
              {totalResults} visits
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 w-16">ID</th>
                {!isSalesman && <th className="p-3">Salesman</th>}
                <th className="p-3">Party</th>
                <th className="p-3">Visit Date</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Photos</th>
                <th className="p-3">Collection</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={isSalesman ? 8 : 9} className="p-8 text-center text-gray-400">
                    <FiRefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                    Loading visits...
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={isSalesman ? 8 : 9} className="p-8 text-center text-gray-400">
                    No visits found for the criteria.
                  </td>
                </tr>
              ) : (
                visits.map((v) => {
                  const sName = v.salesman?.name || v.salesmanName || '-';
                  const pName =
                    v.partyName ||
                    (typeof v.party?.name === 'object'
                      ? v.party.name.en || Object.values(v.party.name)[0]
                      : v.party?.name) ||
                    '-';
                  const status = v.status || 'Pending';
                  const totalPhotosCount =
                    (v.inPhoto ? 1 : 0) +
                    (v.outPhoto ? 1 : 0) +
                    (Array.isArray(v.additionalPhotos) ? v.additionalPhotos.length : 0);

                  return (
                    <tr
                      key={v._id}
                      className="hover:bg-purple-50/40 dark:hover:bg-gray-700/30 transition"
                    >
                      <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-700 text-white rounded-full text-[10px] font-bold mr-1">
                          #{v.visitId || '-'}
                        </span>
                      </td>
                      {!isSalesman && (
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                          {sName}
                        </td>
                      )}
                      <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                        {pName}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {v.visitDate ? dayjs(v.visitDate).format('DD-MMM-YYYY') : '-'}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate" title={v.purpose}>
                        {v.purpose || '-'}
                      </td>
                      <td className="p-3">
                        {totalPhotosCount > 0 ? (
                          <span
                            onClick={() => handleOpenView(v)}
                            className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-200"
                          >
                            <FiImage className="w-3 h-3" /> {totalPhotosCount} photos
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {v.collection ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 font-bold text-emerald-800 dark:text-emerald-200 text-xs">
                            ₹ {v.collection}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            status === 'Completed'
                              ? 'bg-emerald-500 text-white'
                              : status === 'In Progress'
                              ? 'bg-blue-500 text-white'
                              : 'bg-amber-400 text-white'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visit Lifecycle Buttons: Check In, Check Out, Add Photo */}
                          {status === 'Pending' && (
                            <button
                              onClick={() => handleOpenCheckIn(v)}
                              title="Arrived at party: Check In with In-Photo & Location"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition shadow-sm"
                            >
                              <FiLogIn className="w-3.5 h-3.5" /> Check In
                            </button>
                          )}

                          {status === 'In Progress' && (
                            <>
                              <button
                                onClick={() => handleOpenAddPhoto(v)}
                                title="Add additional photo with location"
                                className="flex items-center gap-1 px-2 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded text-xs transition shadow-sm"
                              >
                                <FiCamera className="w-3.5 h-3.5" /> + Photo
                              </button>
                              <button
                                onClick={() => handleOpenCheckOut(v)}
                                title="Leaving party: Check Out with Out-Photo & Collection"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-sm"
                              >
                                <FiLogOut className="w-3.5 h-3.5" /> Check Out
                              </button>
                            </>
                          )}

                          {/* Standard View, Edit, Delete */}
                          <button
                            onClick={() => handleOpenView(v)}
                            title="View visit details"
                            className="p-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded transition"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>

                          {!isSalesman && (
                            <>
                              <Link
                                to={`/salesman-visits/edit/${v._id}`}
                                title="Edit visit"
                                className="p-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded transition"
                              >
                                <FiEdit className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteVisit(v._id)}
                                title="Delete visit"
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* ============================================================= */}
      {/* CHECK-IN MODAL (Arrival: In-Photo + Live GPS)                  */}
      {/* ============================================================= */}
      {checkInModalOpen && checkInTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl max-h-[92vh] flex flex-col border border-emerald-300 dark:border-emerald-800 overflow-hidden my-auto">
            <div className="shrink-0 p-3.5 sm:p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiLogIn className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm md:text-base truncate">
                  Check-In at Party: {checkInTarget.partyName || checkInTarget.party?.name || 'Party'}
                </span>
              </div>
              <button
                onClick={() => setCheckInModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 text-xs md:text-sm custom-scrollbar">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">
                    📌 Purpose: {checkInTarget.purpose || 'Visit'}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Check-in marks this visit as &quot;In Progress&quot; and logs your arrival proof with live GPS.
                  </p>
                </div>

                {/* GPS Location Card */}
                <LocationCaptureCard
                  gpsLocation={gpsLocation}
                  setGpsLocation={setGpsLocation}
                  onRefreshGPS={captureGPS}
                  colorScheme="emerald"
                />

                {/* Arrival Photo with Live Camera & File Upload */}
                <CameraPhotoInput
                  photo={inPhoto}
                  onPhotoChange={setInPhoto}
                  label="Arrival Photo (&quot;In Photo&quot;)"
                  required={true}
                  helperText="Click photo live using your camera or choose from device files"
                  colorScheme="emerald"
                />

                {/* Arrival Notes */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Arrival Notes (Optional)
                  </label>
                  <textarea
                    value={inNotes}
                    onChange={(e) => setInNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Reached shop, met owner Mr. Sharma..."
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded p-2 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Submit Button Sticky Footer */}
              <div className="shrink-0 flex items-center justify-end gap-2 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCheckInModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded-lg font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inSubmitting || !inPhoto}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition shadow-sm hover:shadow disabled:opacity-50"
                >
                  {inSubmitting ? (
                    <>
                      <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Checking In...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" /> Confirm Check-In
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CHECK-OUT MODAL (Exit: Out-Photo + Location + Collection)      */}
      {/* ============================================================= */}
      {checkOutModalOpen && checkOutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl border border-blue-300 dark:border-blue-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-3.5 sm:p-4 bg-blue-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FiLogOut className="w-5 h-5" />
                <span className="font-bold text-sm md:text-base">
                  Check-Out from Party: {checkOutTarget.partyName || checkOutTarget.party?.name || 'Party'}
                </span>
              </div>
              <button
                onClick={() => setCheckOutModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckOut} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 text-xs md:text-sm">
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                  <p className="font-semibold">
                    📌 Checked-In at:{' '}
                    {checkOutTarget.checkInTime
                      ? dayjs(checkOutTarget.checkInTime).format('DD-MMM-YYYY HH:mm')
                      : 'Earlier'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    Check-out completes the visit, captures the exit photo proof, and records any collected payment.
                  </p>
                </div>

                {/* GPS Location Card */}
                <LocationCaptureCard
                  gpsLocation={gpsLocation}
                  setGpsLocation={setGpsLocation}
                  onRefreshGPS={captureGPS}
                  colorScheme="blue"
                />

                {/* Exit Photo with Live Camera & File Upload */}
                <CameraPhotoInput
                  photo={outPhoto}
                  onPhotoChange={setOutPhoto}
                  label="Exit Photo (&quot;Out Photo&quot;)"
                  required={true}
                  helperText="Take exit photo with live camera or choose from files"
                  colorScheme="blue"
                />

                {/* Collection Details (Optional) */}
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                    <FiDollarSign className="w-4 h-4 text-purple-700" /> Payment Collection (If any)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                        Amount Collected (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={collectionAmount}
                        onChange={(e) => setCollectionAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                        Payment Mode / Receipt #
                      </label>
                      <input
                        type="text"
                        value={collectionNotes}
                        onChange={(e) => setCollectionNotes(e.target.value)}
                        placeholder="e.g. Cash / Cheque #1234 / UPI"
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Exit Notes */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Visit Summary / Exit Notes
                  </label>
                  <textarea
                    value={outNotes}
                    onChange={(e) => setOutNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Order discussed, catalogue shown, next visit scheduled on Friday..."
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded p-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Submit Button (Sticky Footer) */}
              <div className="shrink-0 flex items-center justify-end gap-2 p-3 sm:px-5 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCheckOutModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={outSubmitting || !outPhoto}
                  className="flex items-center gap-1.5 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs transition disabled:opacity-50"
                >
                  {outSubmitting ? (
                    <>
                      <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Completing Visit...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" /> Complete & Check-Out
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ADD ADDITIONAL PHOTO MODAL (+ Photo with live GPS)            */}
      {/* ============================================================= */}
      {addPhotoModalOpen && addPhotoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-purple-300 dark:border-purple-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-3.5 sm:p-4 bg-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FiCamera className="w-5 h-5" />
                <span className="font-bold text-sm md:text-base">
                  Upload Additional Photo (Party: {addPhotoTarget.partyName || 'Party'})
                </span>
              </div>
              <button
                onClick={() => setAddPhotoModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddPhoto} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 text-xs md:text-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can capture or upload additional photos (e.g. stock shelves, product catalog, damaged goods, storefront) with current location tag.
                </p>

                {/* Photo with Live Camera & File Upload */}
                <CameraPhotoInput
                  photo={additionalPhoto}
                  onPhotoChange={setAdditionalPhoto}
                  label="Visit Photo"
                  required={true}
                  helperText="Capture photo live with device camera or choose from files"
                  colorScheme="purple"
                />

                {/* Caption */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Caption / Description
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Competitor display, Stock verification, Invoice copy"
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600"
                  />
                </div>

                {/* GPS Location Card */}
                <LocationCaptureCard
                  gpsLocation={gpsLocation}
                  setGpsLocation={setGpsLocation}
                  onRefreshGPS={captureGPS}
                  colorScheme="purple"
                />
              </div>

              {/* Submit Button (Sticky Footer) */}
              <div className="shrink-0 flex items-center justify-end gap-2 p-3 sm:px-5 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAddPhotoModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={photoSubmitting || !additionalPhoto}
                  className="flex items-center gap-1.5 px-6 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded font-bold text-xs transition disabled:opacity-50"
                >
                  {photoSubmitting ? (
                    <>
                      <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-4 h-4" /> Upload Photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW VISIT DETAILS MODAL                                      */}
      {/* ============================================================= */}
      {showViewModal && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl border border-purple-200 dark:border-purple-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">
                  {selectedVisit.visitDate
                    ? dayjs(selectedVisit.visitDate).format('DD-MMM-YYYY')
                    : 'Visit Details'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold text-xs ${
                    selectedVisit.status === 'Completed'
                      ? 'bg-emerald-500 text-white'
                      : selectedVisit.status === 'In Progress'
                      ? 'bg-blue-500 text-white'
                      : 'bg-amber-400 text-white'
                  }`}
                >
                  {selectedVisit.status || 'Pending'}
                </span>
                <span className="text-xs text-gray-500">
                  Salesman: {selectedVisit.salesman?.name || selectedVisit.salesmanName} | Party:{' '}
                  {selectedVisit.partyName || selectedVisit.party?.name || '-'}
                </span>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left 2 Cols: Purpose, Notes, Location Details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Purpose
                    </label>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">
                      {selectedVisit.purpose || '-'}
                    </p>
                  </div>

                  {selectedVisit.notes && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Notes / Activity Log
                      </label>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-line bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded">
                        {selectedVisit.notes}
                      </p>
                    </div>
                  )}

                  {/* Check-In Proof Card */}
                  <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 overflow-hidden shadow-sm">
                    <div className="bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FiLogIn className="w-3.5 h-3.5" /> Check-In Proof (Arrival)
                      </span>
                      {selectedVisit.checkInTime && (
                        <span className="text-[11px] font-normal">
                          {dayjs(selectedVisit.checkInTime).format('DD-MMM-YYYY HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-3 items-center">
                      {selectedVisit.inPhoto ? (
                        <img
                          src={selectedVisit.inPhoto}
                          alt="In Photo"
                          onClick={() => setLightboxImage(selectedVisit.inPhoto)}
                          className="h-32 w-44 rounded object-cover border cursor-pointer hover:opacity-90 transition"
                          title="Click to enlarge"
                        />
                      ) : (
                        <div className="h-32 w-44 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-400">
                          <FiImage className="w-8 h-8 mb-1" />
                          <span className="text-[11px]">No In-Photo</span>
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5 text-xs">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          📍 {selectedVisit.inLocation?.address || selectedVisit.location?.address || 'Address recorded'}
                        </p>
                        {selectedVisit.inLocation?.latitude != null && (
                          <p className="font-mono text-emerald-600 text-[11px]">
                            GPS: {selectedVisit.inLocation.latitude}, {selectedVisit.inLocation.longitude} (±{selectedVisit.inLocation.accuracy || 10}m)
                          </p>
                        )}
                        {selectedVisit.inLocation?.timestamp && (
                          <p className="text-[11px] text-gray-400">
                            Time: {dayjs(selectedVisit.inLocation.timestamp).format('DD-MMM-YYYY HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Check-Out Proof Card */}
                  <div className="rounded-lg border border-blue-300 dark:border-blue-800 overflow-hidden shadow-sm">
                    <div className="bg-blue-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FiLogOut className="w-3.5 h-3.5" /> Check-Out Proof (Exit)
                      </span>
                      {selectedVisit.checkOutTime && (
                        <span className="text-[11px] font-normal">
                          {dayjs(selectedVisit.checkOutTime).format('DD-MMM-YYYY HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-3 items-center">
                      {selectedVisit.outPhoto ? (
                        <img
                          src={selectedVisit.outPhoto}
                          alt="Out Photo"
                          onClick={() => setLightboxImage(selectedVisit.outPhoto)}
                          className="h-32 w-44 rounded object-cover border cursor-pointer hover:opacity-90 transition"
                          title="Click to enlarge"
                        />
                      ) : (
                        <div className="h-32 w-44 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-400">
                          <FiImage className="w-8 h-8 mb-1" />
                          <span className="text-[11px]">No Out-Photo</span>
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5 text-xs">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          📍 {selectedVisit.outLocation?.address || 'Exit location recorded'}
                        </p>
                        {selectedVisit.outLocation?.latitude != null && (
                          <p className="font-mono text-blue-600 text-[11px]">
                            GPS: {selectedVisit.outLocation.latitude}, {selectedVisit.outLocation.longitude} (±{selectedVisit.outLocation.accuracy || 10}m)
                          </p>
                        )}
                        {selectedVisit.outLocation?.timestamp && (
                          <p className="text-[11px] text-gray-400">
                            Time: {dayjs(selectedVisit.outLocation.timestamp).format('DD-MMM-YYYY HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Photos Gallery */}
                  {Array.isArray(selectedVisit.additionalPhotos) &&
                    selectedVisit.additionalPhotos.length > 0 && (
                      <div className="rounded-lg border border-purple-300 dark:border-purple-800 overflow-hidden shadow-sm">
                        <div className="bg-purple-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FiImage className="w-3.5 h-3.5" /> Additional Site Photos ({selectedVisit.additionalPhotos.length})
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedVisit.additionalPhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-gray-50 dark:bg-gray-700/30 text-[11px] space-y-1"
                            >
                              <img
                                src={photo.url}
                                alt={`Photo ${pIdx + 1}`}
                                onClick={() => setLightboxImage(photo.url)}
                                className="h-28 w-full rounded object-cover cursor-pointer hover:opacity-90 transition"
                                title="Click to enlarge"
                              />
                              {photo.caption && (
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                  {photo.caption}
                                </p>
                              )}
                              {photo.latitude != null && (
                                <p className="text-gray-400 font-mono text-[10px]">
                                  📍 {photo.latitude}, {photo.longitude}
                                </p>
                              )}
                              {photo.timestamp && (
                                <p className="text-gray-400 text-[10px]">
                                  {dayjs(photo.timestamp).format('DD-MMM HH:mm')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Right Col: Time Tracking & Collection */}
                <div className="space-y-4">
                  {/* Time Tracking Card */}
                  <div className="rounded-lg border border-amber-300 dark:border-amber-800 overflow-hidden shadow-sm">
                    <div className="bg-amber-500 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" /> Time Tracking
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 space-y-3 text-xs">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Check-In Time</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedVisit.checkInTime
                            ? dayjs(selectedVisit.checkInTime).format('DD-MMM-YYYY HH:mm')
                            : 'Not checked in yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Check-Out Time</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedVisit.checkOutTime
                            ? dayjs(selectedVisit.checkOutTime).format('DD-MMM-YYYY HH:mm')
                            : 'Not checked out yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Scheduled Visit Date</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedVisit.visitDate
                            ? dayjs(selectedVisit.visitDate).format('DD-MMM-YYYY')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collection Card */}
                  {(selectedVisit.collectionAmount > 0 || selectedVisit.collection > 0) && (
                    <div className="rounded-lg border border-purple-300 dark:border-purple-800 overflow-hidden p-3 bg-purple-50 dark:bg-purple-950/30 text-xs shadow-sm">
                      <span className="text-purple-700 dark:text-purple-300 font-bold block mb-1">
                        💰 Collection Received
                      </span>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        ₹ {(selectedVisit.collectionAmount || selectedVisit.collection).toLocaleString()}
                      </p>
                      {selectedVisit.collectionNotes && (
                        <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-1">
                          {selectedVisit.collectionNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions in View Modal for Salesman */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30 space-y-2">
                    <span className="font-bold text-gray-700 dark:text-gray-300 block text-xs">
                      Quick Actions
                    </span>
                    {selectedVisit.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleOpenCheckIn(selectedVisit);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition"
                      >
                        <FiLogIn className="w-3.5 h-3.5" /> Check In Now
                      </button>
                    )}
                    {selectedVisit.status === 'In Progress' && (
                      <>
                        <button
                          onClick={() => {
                            setShowViewModal(false);
                            handleOpenAddPhoto(selectedVisit);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded text-xs transition"
                        >
                          <FiCamera className="w-3.5 h-3.5" /> + Upload Photo
                        </button>
                        <button
                          onClick={() => {
                            setShowViewModal(false);
                            handleOpenCheckOut(selectedVisit);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition"
                        >
                          <FiLogOut className="w-3.5 h-3.5" /> Complete Visit & Check Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="shrink-0 p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-right">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* FULLSIZE IMAGE LIGHTBOX                                        */}
      {/* ============================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Enlarged proof"
              className="max-h-[85vh] max-w-full rounded shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesmanVisits;
