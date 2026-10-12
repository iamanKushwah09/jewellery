import React, { useState, useEffect, useContext, useMemo } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { FiX, FiRefreshCw, FiBox, FiArrowUp, FiArrowDown, FiLayers } from "react-icons/fi";
import dayjs from "dayjs";

// Internal imports
import InventoryServices from "@/services/InventoryServices";
import Loading from "@/components/preloader/Loading";
import { SidebarContext } from "@/context/SidebarContext";

const TYPE_BADGES = {
  item: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  sale: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
  stock: "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
};

const resolveCleanType = (log) => {
  const code = log.source_code;
  const name = String(log.source_name || log.type || "").toLowerCase();
  const mType = String(log.movement_type || "").toLowerCase();

  if (code === 5 || mType === "out" || mType === "sale" || name.includes("sale") || name.includes("sold") || name.includes("order")) {
    return "sale";
  }
  if (code === 1 || mType === "initial" || mType === "item" || name.includes("create") || name.includes("item")) {
    return "item";
  }
  return "stock";
};

const ItemStockLifecycleDrawer = ({ itemId, itemCode, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' = Chronological (Sheet order), 'desc' = Newest first

  const { navBar, windowDimension } = useContext(SidebarContext) || {};
  const isSidebarClosed = !navBar || (windowDimension && windowDimension < 1024);
  const drawerWidth = isSidebarClosed ? "100%" : "calc(100% - 288px)";

  const identifier = itemId || itemCode;

  const fetchHistory = async () => {
    if (!identifier) return;
    try {
      setLoading(true);
      const res = await InventoryServices.getItemInventoryHistory(identifier, {
        order: sortOrder,
      });
      if (res && res.status === "success") {
        setData(res);
      }
    } catch (err) {
      console.error("Error fetching stock history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, sortOrder]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!identifier) return null;

  const item = data?.item || null;
  const rawLogs = data?.data || [];

  // Filter out any sync records on frontend as well to be 100% sure
  const filteredLogs = rawLogs.filter((log) => {
    const type = resolveCleanType(log);
    const src = String(log.source_name || "").toLowerCase();
    if (log.source_code === 3 || src.includes("sync")) return false;
    if (selectedFilter !== "all" && type !== selectedFilter) return false;
    return true;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: drawerWidth }}
        className="w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transition-all duration-300"
      >
        {/* Simple Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between z-10 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Item Stock History
            </h2>
            {/* <p className="text-xs text-gray-500 dark:text-gray-400">
              Item, Sale aur Stock ki poori history
            </p> */}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle Button */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={sortOrder === "asc" ? "Sorted Oldest First (Click for Newest First)" : "Sorted Newest First (Click for Oldest First)"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {sortOrder === "asc" ? (
                <>
                  <FiArrowUp className="w-3.5 h-3.5 text-primary" />
                  <span>Oldest First</span>
                </>
              ) : (
                <>
                  <FiArrowDown className="w-3.5 h-3.5 text-primary" />
                  <span>Newest First</span>
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item Summary Bar */}
        {item && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.name}
              </span>
              <span className="ml-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                (Code: {item.item_code || "—"})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Current Stock:</span>
              <span className="font-bold font-mono text-sm px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                {Number(item.stock || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Filter Pills Bar */}
        <div className="px-6 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs">
          <span className="text-gray-400 mr-1 font-medium">Filter:</span>
          {["all", "item", "sale", "stock"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedFilter(t)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-colors ${
                selectedFilter === t
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stock History Table */}
        <Scrollbars autoHide style={{ flex: 1 }}>
          <div className="p-6">
            {loading && !data ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loading loading={true} />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-14 text-center text-gray-400 border border-dashed rounded-xl">
                <FiBox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Koi stock record nahi mila</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-xs">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="py-3 px-6">Date</th>
                      <th className="py-3 px-6">type</th>
                      <th className="py-3 px-6 text-right">stock</th>
                      <th className="py-3 px-6 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {filteredLogs.map((log) => {
                      const cleanType = resolveCleanType(log);
                      const badge = TYPE_BADGES[cleanType] || TYPE_BADGES.stock;

                      const prev = log.previous_stock ?? log.opening_stock ?? 0;
                      const curr = log.current_stock ?? log.closing_stock ?? 0;
                      const diff = log.quantity_changed !== undefined ? log.quantity_changed : (curr - prev);

                      // Transaction stock amount:
                      // For item: initial stock
                      // For sale: sold quantity
                      // For stock: added or changed quantity
                      let txnStock = log.stock !== undefined ? log.stock : Math.abs(diff);
                      if (cleanType === "item" && prev === 0 && curr > 0) {
                        txnStock = curr;
                      }

                      // Balance after this transaction
                      const balance = log.balance !== undefined ? log.balance : curr;

                      return (
                        <tr key={log._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                          {/* Date */}
                          <td className="py-3.5 px-6 text-gray-700 dark:text-gray-300">
                            <div className="font-mono font-medium">
                              {dayjs(log.createdAt).format("DD/MM/YY")}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {dayjs(log.createdAt).format("hh:mm A")}
                            </div>
                          </td>

                          {/* type */}
                          <td className="py-3.5 px-6">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                              {cleanType}
                            </span>
                          </td>

                          {/* stock */}
                          <td className="py-3.5 px-6 text-right">
                            <span
                              className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                                cleanType === "sale"
                                  ? "text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300"
                                  : cleanType === "stock"
                                  ? "text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              {txnStock}
                            </span>
                          </td>

                          {/* Balance */}
                          <td className="py-3.5 px-6 text-right font-mono font-bold text-sm text-gray-900 dark:text-white">
                            {balance}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Scrollbars>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex justify-between items-center text-xs text-gray-500">
          <span>Total {filteredLogs.length} record(s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemStockLifecycleDrawer;
