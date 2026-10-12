import React, { useState, useEffect, useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiSearch,
  FiPlus,
  FiRotateCcw,
  FiEdit3,
  FiDollarSign,
  FiX,
  FiSave,
  FiMap,
  FiTrash2,
} from 'react-icons/fi';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { AdminContext } from '@/context/AdminContext';
import { notifySuccess, notifyError } from '@/utils/toast';

const SalesmanRoutes = () => {
  const history = useHistory();
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Collection Modal state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [activePartyItem, setActivePartyItem] = useState(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  const fetchRoutes = async (search = searchQuery, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await SalesmanVisitServices.getAllRoutes({
        search,
        status,
        limit: 50,
      });
      setRoutes(res.routes || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
      notifyError('Failed to load salesman routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes(searchQuery, statusFilter);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRoutes(searchQuery, statusFilter);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    fetchRoutes('', '');
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await SalesmanVisitServices.deleteRoute(id);
      notifySuccess('Route deleted successfully');
      fetchRoutes();
    } catch (err) {
      console.error('Failed to delete route:', err);
      notifyError('Failed to delete route');
    }
  };

  const handleOpenCollectionModal = (route, partyObj) => {
    setActivePartyItem({
      routeId: route._id,
      salesmanId: route.salesman?._id || route.salesman,
      salesmanName: route.salesman?.name || route.salesmanName,
      partyId: partyObj.party?._id || partyObj.party,
      partyName: partyObj.partyName || (partyObj.party?.name ? (typeof partyObj.party.name === 'object' ? partyObj.party.name.en || Object.values(partyObj.party.name)[0] : partyObj.party.name) : 'SHOWROOM'),
    });
    setCollectionAmount('');
    setCollectionNotes('');
    setCollectionModalOpen(true);
  };

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!collectionAmount || Number(collectionAmount) <= 0) {
      notifyError('Please enter a valid collection amount');
      return;
    }

    try {
      setIsSubmittingCollection(true);
      await SalesmanVisitServices.addCollection({
        salesman: activePartyItem.salesmanId,
        salesmanName: activePartyItem.salesmanName,
        party: activePartyItem.partyId,
        partyName: activePartyItem.partyName,
        route: activePartyItem.routeId,
        collectionAmount: Number(collectionAmount),
        notes: collectionNotes,
        status: 'Received',
      });

      notifySuccess('Collection saved successfully');
      setCollectionModalOpen(false);
      fetchRoutes();
    } catch (err) {
      console.error('Failed to save collection:', err);
      notifyError(err.response?.data?.message || 'Failed to save collection');
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMap className="text-purple-700 dark:text-purple-400 w-6 h-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isSalesman ? 'My Assigned Routes' : 'Salesman Routes'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isSalesman ? 'View your daily assigned party routes and record collections' : 'Assign routes to salesmen and track visit completion'}
            </p>
          </div>
        </div>
        {!isSalesman && (
          <Link
            to="/salesman-routes/create"
            className="flex items-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm px-4 py-2 rounded transition shadow-sm"
          >
            <FiPlus className="w-4 h-4" /> Create New Route
          </Link>
        )}
      </div>

      {/* Filter Routes Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4">
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FiSearch className="w-3.5 h-3.5" /> Filter Routes
        </h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Search Input */}
          <div className="md:col-span-6">
            <label className="text-xs text-gray-500 block mb-1">Search ({isSalesman ? 'Party' : 'Name/Party'})</label>
            <input
              type="text"
              placeholder={isSalesman ? 'Search party...' : 'Search salesman or party...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <label className="text-xs text-gray-500 block mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="">-- All Status --</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm py-2 rounded transition shadow-sm"
            >
              <FiSearch className="w-4 h-4" /> Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm py-2 rounded transition shadow-sm"
            >
              <FiRotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </form>
      </div>

      {/* Routes Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-900 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-sm md:text-base text-gray-800 dark:text-gray-100">
            {isSalesman ? 'My Assigned Party Routes' : 'Routes with Party Assignment'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 w-20">Route ID</th>
                {!isSalesman && <th className="p-3">Salesman</th>}
                <th className="p-3">Route Date</th>
                <th className="p-3">Party</th>
                <th className="p-3">Status</th>
                <th className="p-3">Collection</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={isSalesman ? 6 : 7} className="p-8 text-center text-gray-400">
                    Loading routes...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={isSalesman ? 6 : 7} className="p-8 text-center text-gray-400">
                    No routes found
                  </td>
                </tr>
              ) : (
                routes.flatMap((r) => {
                  const sName = r.salesman?.name || r.salesmanName || '-';
                  const dateStr = r.routeDate ? dayjs(r.routeDate).format('DD-MMM-YYYY') : '-';

                  // If route has multiple assigned parties, list each party row
                  const partiesToRender =
                    r.parties && r.parties.length > 0
                      ? r.parties
                      : [
                          {
                            party: r.party,
                            partyName:
                              r.partyName ||
                              (typeof r.party?.name === 'object'
                                ? r.party.name.en || Object.values(r.party.name)[0]
                                : r.party?.name) ||
                              'SHOWROOM',
                            status: r.status || 'Pending',
                            collectionAmount: r.collection || 0,
                          },
                        ];

                  return partiesToRender.map((pObj, idx) => {
                    const partyName =
                      pObj.partyName ||
                      (pObj.party?.name
                        ? typeof pObj.party.name === 'object'
                          ? pObj.party.name.en || Object.values(pObj.party.name)[0]
                          : pObj.party.name
                        : 'SHOWROOM');
                    const status = pObj.status || r.status || 'Pending';
                    const colAmount = pObj.collectionAmount || r.collection || 0;

                    return (
                      <tr
                        key={`${r._id}-${idx}`}
                        className="hover:bg-purple-50/40 dark:hover:bg-gray-700/30 transition"
                      >
                        <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-teal-500 text-white rounded text-[10px] font-bold mr-1">
                            {r.routeId || idx + 1}
                          </span>
                        </td>
                        {!isSalesman && (
                          <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                            {sName}
                          </td>
                        )}
                        <td className="p-3 text-gray-600 dark:text-gray-400">{dateStr}</td>
                        <td className="p-3 font-bold text-gray-900 dark:text-gray-100 uppercase">
                          {partyName}
                        </td>
                        <td className="p-3">
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
                        <td className="p-3">
                          {colAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                              ₹ {colAmount}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Visit button */}
                            <Link
                              to={`/salesman-visits/create?routeId=${r._id}&partyId=${
                                pObj.party?._id || pObj.party
                              }&salesmanId=${r.salesman?._id || r.salesman}`}
                              className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs px-2.5 py-1.5 rounded transition shadow-sm"
                            >
                              <FiEdit3 className="w-3.5 h-3.5" /> Visit
                            </Link>

                            {/* + Collection button */}
                            <button
                              type="button"
                              onClick={() => handleOpenCollectionModal(r, pObj)}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded transition shadow-sm"
                            >
                              <FiPlus className="w-3.5 h-3.5" /> Collection
                            </button>

                            {/* Delete Route (Admin only) */}
                            {!isSalesman && idx === 0 && (
                              <button
                                onClick={() => handleDeleteRoute(r._id)}
                                title="Delete Route"
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Collection Modal (Matching Screenshot 3) */}
      {collectionModalOpen && activePartyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-emerald-500 overflow-hidden">
            {/* Modal Header (Green background) */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between font-bold text-sm md:text-base">
              <span>Add Collection - {activePartyItem.partyName}</span>
              <button
                onClick={() => setCollectionModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCollection} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Collection Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(e.target.value)}
                    className="w-full text-xs md:text-sm pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add notes..."
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCollectionModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCollection}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {isSubmittingCollection ? 'Saving...' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesmanRoutes;
