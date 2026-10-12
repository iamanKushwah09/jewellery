import React, { useState, useEffect, useContext } from 'react';
import dayjs from 'dayjs';
import {
  FiFilter,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiFileText,
  FiUser,
  FiRefreshCw,
} from 'react-icons/fi';
import SalesmanServices from '@/services/SalesmanServices';
import SalesmanVisitServices from '@/services/SalesmanVisitServices';
import { AdminContext } from '@/context/AdminContext';
import { notifyError } from '@/utils/toast';

const SalesmanCollectionReport = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  const [salesmen, setSalesmen] = useState([]);
  const [salesmanId, setSalesmanId] = useState(adminInfo?.salesman_id || '');
  const [fromDate, setFromDate] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSalesman, setSelectedSalesman] = useState('All Salesmen');
  const [loading, setLoading] = useState(false);

  const [kpis, setKpis] = useState({
    totalCollection: '0.00',
    totalVisits: 0,
    uniqueParties: 0,
    avgCollectionPerVisit: '0',
  });

  const [detailedReport, setDetailedReport] = useState([]);
  const [summaryBySalesman, setSummaryBySalesman] = useState([]);

  // Logged-in salesman display name
  const salesmanDisplayName =
    (typeof adminInfo?.name === 'object'
      ? adminInfo.name.en || Object.values(adminInfo.name)[0]
      : adminInfo?.name) ||
    adminInfo?.email?.split('@')[0] ||
    'Salesman';

  // Load salesmen list (used for admin filter & auto-resolving salesman ID)
  useEffect(() => {
    const fetchSalesmenList = async () => {
      try {
        const res = await SalesmanServices.getAllSalesman({ limit: 100 });
        if (res?.salesmans) {
          setSalesmen(res.salesmans);

          // Auto-resolve salesman ID for logged in salesman if not in adminInfo
          if (isSalesman && !salesmanId) {
            const myEmail = adminInfo?.email?.toLowerCase();
            const myName =
              typeof adminInfo?.name === 'object'
                ? adminInfo.name.en || Object.values(adminInfo.name)[0]
                : adminInfo?.name;

            const match = res.salesmans.find(
              (s) =>
                (myEmail && s.email && s.email.toLowerCase() === myEmail) ||
                (myName && s.name && s.name.toLowerCase() === myName.toLowerCase())
            );
            if (match) {
              setSalesmanId(match._id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load salesmen:', err);
      }
    };
    fetchSalesmenList();
  }, [isSalesman, adminInfo, salesmanId]);

  const loadReportData = async (targetSalesman = null) => {
    try {
      setLoading(true);
      const params = {
        fromDate,
        toDate,
      };

      if (isSalesman) {
        const sId = targetSalesman || salesmanId || adminInfo?.salesman_id || '';
        if (sId) {
          params.salesman = sId;
        }
      } else {
        if (selectedSalesman && selectedSalesman !== 'All Salesmen') {
          params.salesman = selectedSalesman;
        }
      }

      const res = await SalesmanVisitServices.getCollectionReport(params);

      if (res?.kpis) {
        setKpis(res.kpis);
      }
      setDetailedReport(res?.detailedReport || []);
      setSummaryBySalesman(res?.summaryBySalesman || []);
    } catch (err) {
      console.error('Failed to generate collection report:', err);
      notifyError('Failed to generate collection report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [salesmanId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReportData();
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>💰</span> {isSalesman ? 'My Field Collection Report' : 'Salesman Collection Report'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isSalesman
              ? 'View and track your collected payments, cash/cheque receipts, and visit averages'
              : 'Track company-wide payment receipts and collections across all sales representatives'}
          </p>
        </div>

        {/* Salesman Profile Badge */}
        {isSalesman && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-200 text-xs self-start md:self-auto">
            <FiUser className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>
              <strong>{salesmanDisplayName}</strong> (Only your data)
            </span>
          </div>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900 mb-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* From Date */}
          <div className={isSalesman ? 'md:col-span-5' : 'md:col-span-3'}>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* To Date */}
          <div className={isSalesman ? 'md:col-span-5' : 'md:col-span-3'}>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Salesman Filter (Admin only) */}
          {!isSalesman && (
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Filter by Salesman
              </label>
              <select
                value={selectedSalesman}
                onChange={(e) => setSelectedSalesman(e.target.value)}
                className="w-full text-xs md:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
              >
                <option value="All Salesmen">-- All Salesmen --</option>
                {salesmen.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs md:text-sm py-2 rounded-lg transition shadow-sm disabled:opacity-50"
            >
              <FiFilter className="w-3.5 h-3.5" />
              <span>{loading ? 'Filtering...' : 'Apply Filter'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Collection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-900 text-center shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSalesman ? 'My Total Collection' : 'Total Collection'}
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹ {Number(kpis.totalCollection || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Visits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-900 text-center shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSalesman ? 'My Completed Visits' : 'Total Visits'}
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {kpis.totalVisits}
          </p>
        </div>

        {/* Unique Parties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-900 text-center shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSalesman ? 'Parties Collected From' : 'Unique Parties'}
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-sky-500 dark:text-sky-400 mt-1">
            {kpis.uniqueParties}
          </p>
        </div>

        {/* Avg Collection/Visit */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-900 text-center shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSalesman ? 'Avg / Visit' : 'Avg Collection/Visit'}
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">
            ₹ {Number(kpis.avgCollectionPerVisit || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table 1: Detailed Collection Report */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-900 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-sm md:text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FiFileText className="text-purple-700 dark:text-purple-400" />
            {isSalesman ? 'My Collection Receipts' : 'Detailed Collection Report'}
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            {detailedReport.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                <th className="p-3">Receipt / Visit Date</th>
                {!isSalesman && <th className="p-3">Salesman</th>}
                <th className="p-3">Party Name</th>
                <th className="p-3">Collection Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Recorded On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={isSalesman ? 5 : 6} className="p-8 text-center text-gray-400">
                    <FiRefreshCw className="w-4 h-4 animate-spin inline mr-2 text-purple-600" />
                    Loading records...
                  </td>
                </tr>
              ) : detailedReport.length === 0 ? (
                <tr>
                  <td colSpan={isSalesman ? 5 : 6} className="p-8 text-center text-gray-400">
                    No collection records found for this period.
                  </td>
                </tr>
              ) : (
                detailedReport.map((row, idx) => (
                  <tr
                    key={row._id || idx}
                    className="hover:bg-purple-50/40 dark:hover:bg-gray-700/30 transition"
                  >
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] font-bold mr-1.5">
                        ₹
                      </span>
                      {row.visitDate ? dayjs(row.visitDate).format('DD-MMM-YYYY') : '-'}
                    </td>
                    {!isSalesman && (
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                        {row.salesman}
                      </td>
                    )}
                    <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                      {row.party}
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ₹ {Number(row.collectionAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {row.status || 'Received'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {row.collectionDate ? dayjs(row.collectionDate).format('DD-MMM-YYYY') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Summary by Salesman (Admin only) */}
      {!isSalesman && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-900 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-sm md:text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <FiUsers className="text-purple-700 dark:text-purple-400" /> Summary by Salesman (Admin View)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3">Salesman</th>
                  <th className="p-3">Total Collection</th>
                  <th className="p-3">Total Visits</th>
                  <th className="p-3">Avg/Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      Loading summary...
                    </td>
                  </tr>
                ) : summaryBySalesman.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      No summary data available
                    </td>
                  </tr>
                ) : (
                  summaryBySalesman.map((s, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-purple-50/40 dark:hover:bg-gray-700/30 transition"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                        {s.salesman}
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {Number(s.totalCollection || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                        {s.totalVisits}
                      </td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                        ₹ {s.avgPerVisit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesmanCollectionReport;
