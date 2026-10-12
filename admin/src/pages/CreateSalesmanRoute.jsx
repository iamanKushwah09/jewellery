import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiCheck,
  FiArrowLeft,
  FiSearch,
  FiUsers,
  FiInfo,
} from 'react-icons/fi';
import SalesmanServices from '@/services/SalesmanServices';
import CustomerServices from '@/services/CustomerServices';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { notifySuccess, notifyError } from '@/utils/toast';

const CreateSalesmanRoute = () => {
  const history = useHistory();

  const [salesmen, setSalesmen] = useState([]);
  const [parties, setParties] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedSalesman, setSelectedSalesman] = useState('');
  const [routeDate, setRouteDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedParties, setSelectedParties] = useState([]);
  const [partySearch, setPartySearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesmenRes, customersRes] = await Promise.all([
          SalesmanServices.getAllSalesman({ limit: 100 }),
          CustomerServices.getAllCustomer({ limit: 250 }),
        ]);

        if (salesmenRes?.salesmans) {
          setSalesmen(salesmenRes.salesmans);
        }
        if (customersRes?.customers) {
          setParties(customersRes.customers);
          setFilteredParties(customersRes.customers);
        }
      } catch (err) {
        console.error('Failed to load route options:', err);
      }
    };

    fetchData();
  }, []);

  // Filter parties by name search
  useEffect(() => {
    if (!partySearch.trim()) {
      setFilteredParties(parties);
    } else {
      const q = partySearch.toLowerCase();
      setFilteredParties(
        parties.filter((p) => {
          const name =
            typeof p.name === 'object'
              ? p.name.en || Object.values(p.name)[0]
              : p.name;
          return (name || '').toLowerCase().includes(q);
        })
      );
    }
  }, [partySearch, parties]);

  const handleToggleParty = (id) => {
    setSelectedParties((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllParties = (e) => {
    if (e.target.checked) {
      const allIds = filteredParties.map((p) => p._id);
      setSelectedParties(allIds);
    } else {
      setSelectedParties([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSalesman) {
      notifyError('Please select a salesman');
      return;
    }
    if (selectedParties.length === 0) {
      notifyError('Please select at least one party for the route');
      return;
    }

    try {
      setLoading(true);

      await SalesmanVisitServices.createRoute({
        salesman: selectedSalesman,
        routeDate,
        parties: selectedParties,
      });

      notifySuccess('Salesman route created successfully');
      history.push('/salesman-routes');
    } catch (err) {
      console.error('Failed to create route:', err);
      notifyError(err.response?.data?.message || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  // Find salesman name for summary banner
  const activeSalesmanObj = salesmen.find((s) => s._id === selectedSalesman);
  const activeSalesmanName = activeSalesmanObj
    ? activeSalesmanObj.name
    : '-- Select Salesman --';

  const isAllSelected =
    filteredParties.length > 0 &&
    filteredParties.every((p) => selectedParties.includes(p._id));

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
          Create New Salesman Route
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Salesman & Date Row */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-purple-200 dark:border-purple-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salesman Dropdown */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Salesman <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSalesman}
                onChange={(e) => setSelectedSalesman(e.target.value)}
                required
                className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-purple-600"
              >
                <option value="">-- Select Salesman --</option>
                {salesmen.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Route Date */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Route Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                required
                className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Select Parties for Route (Blue Header) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-sky-300 dark:border-sky-800 overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2.5 font-bold text-sm flex items-center gap-2">
            <FiUsers className="w-4 h-4" /> Select Parties for Route
          </div>

          <div className="p-4 space-y-3">
            {/* Search Parties input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search parties..."
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l px-3 py-2 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                className="bg-purple-800 hover:bg-purple-900 text-white px-4 py-2 rounded-r transition flex items-center gap-1 text-xs font-semibold"
              >
                <FiSearch className="w-3.5 h-3.5" /> Search
              </button>
            </div>

            {/* Select All Checkbox */}
            <div className="pt-1 pb-2 border-b border-gray-200 dark:border-gray-700">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllParties}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                Select All Parties
              </label>
            </div>

            {/* Multi-Select Checkbox List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scroll pr-2">
              {filteredParties.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No parties found</p>
              ) : (
                filteredParties.map((p) => {
                  const name =
                    typeof p.name === 'object'
                      ? p.name.en || Object.values(p.name)[0]
                      : p.name;
                  const isChecked = selectedParties.includes(p._id);

                  return (
                    <label
                      key={p._id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs text-gray-800 dark:text-gray-200 transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleParty(p._id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Selected Count */}
            <p className="text-xs text-gray-500 pt-1">
              <FiInfo className="inline w-3.5 h-3.5 mr-1" />
              Selected: <strong>{selectedParties.length}</strong> parties
            </p>
          </div>
        </div>

        {/* Route Summary Info Banner (Matching Screenshot 3) */}
        <div className="p-3 bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 rounded text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold">ℹ</span>
            <span>
              Route Summary: Salesman: <strong>{activeSalesmanName}</strong>, Date:{' '}
              <strong>{routeDate}</strong>, Parties: <strong>{selectedParties.length}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded transition shadow-sm disabled:opacity-50"
          >
            <FiCheck className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Route'}
          </button>
          <button
            type="button"
            onClick={() => history.push('/salesman-routes')}
            className="flex items-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm px-6 py-2.5 rounded transition shadow-sm"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Routes
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSalesmanRoute;
