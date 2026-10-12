import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  TableBody,
  TableRow,
} from "@windmill/react-ui";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiRotateCw, FiClock, FiExternalLink } from "react-icons/fi";
import dayjs from "dayjs";

// Internal imports
import PageTitle from "@/components/Typography/PageTitle";
import AnimatedContent from "@/components/common/AnimatedContent";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import InventoryServices from "@/services/InventoryServices";
import ItemStockLifecycleDrawer from "@/components/drawer/ItemStockLifecycleDrawer";

const TYPE_CONFIG = {
  item: {
    label: "item",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  },
  stock: {
    label: "stock",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  },
  sale: {
    label: "sale",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
  },
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

const Inventory = () => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(20);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Selected item for full history drawer
  const [selectedItemHistory, setSelectedItemHistory] = useState(null);

  const fetchInventoryLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: resultsPerPage,
        search: searchQuery.trim(),
      };

      const res = await InventoryServices.getAllInventory(params);
      if (res) {
        setLogs(res.logs || []);
        setTotalResults(res.totalDoc || 0);
        setCurrentPage(res.page || page);
      }
    } catch (err) {
      console.error("Failed to load inventory logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = searchInputRef.current?.value || "";
    setSearchQuery(val);
    fetchInventoryLogs(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    if (searchInputRef.current) searchInputRef.current.value = "";
    setCurrentPage(1);
    (async () => {
      setLoading(true);
      try {
        const res = await InventoryServices.getAllInventory({ page: 1, limit: resultsPerPage });
        if (res) {
          setLogs(res.logs || []);
          setTotalResults(res.totalDoc || 0);
          setCurrentPage(1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  };

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / resultsPerPage));

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages && p !== currentPage) {
      setCurrentPage(p);
      fetchInventoryLogs(p);
    }
  };

  const handleOpenItemHistory = (log) => {
    setSelectedItemHistory({
      itemId: log.item_id,
      itemCode: log.item_code,
    });
  };

  return (
    <>
      <div className="mb-4">
        <PageTitle>{t("Item Stock History")}</PageTitle>
        {/* <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
          Item, Sale aur Stock ki poori history
        </p> */}
      </div>

      {/* Item Full Stock History Drawer */}
      {selectedItemHistory && (
        <ItemStockLifecycleDrawer
          itemId={selectedItemHistory.itemId}
          itemCode={selectedItemHistory.itemCode}
          onClose={() => setSelectedItemHistory(null)}
        />
      )}

      <AnimatedContent>
        {/* Simple Filter Bar */}
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5 border border-gray-200 dark:border-gray-700">
          <CardBody className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search */}
              <div className="flex-1 w-full">
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder={t("Search by Item Name or Code...")}
                  className="page-search-input"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  <FiSearch className="mr-1.5" />
                  {t("Search")}
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  className="btn-action-reset h-10 px-3"
                >
                  <FiRotateCw className="mr-1.5" />
                  {t("Reset")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Stock History Table */}
        {loading ? (
          <TableLoading row={8} col={8} width={163} height={20} />
        ) : logs.length === 0 ? (
          <NotFound title="No stock history records found" />
        ) : (
          <TableContainer className="mb-8 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>#</TableCell>
                  <TableCell>{t("Item Name")}</TableCell>
                  <TableCell>{t("Item Code")}</TableCell>
                  <TableCell>{t("Type")}</TableCell>
                  <TableCell className="text-right">{t("Stock")}</TableCell>
                  <TableCell className="text-right">{t("Balance")}</TableCell>
                  <TableCell>{t("Date & Time")}</TableCell>
                  <TableCell>{t("Notes / Details")}</TableCell>
                  <TableCell className="text-center">{t("Action")}</TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => {
                  const cleanType = resolveCleanType(log);
                  const conf = TYPE_CONFIG[cleanType] || TYPE_CONFIG.stock;
                  const prev = log.previous_stock ?? log.opening_stock ?? 0;
                  const curr = log.current_stock ?? log.closing_stock ?? 0;
                  const diff = log.quantity_changed !== undefined ? log.quantity_changed : (curr - prev);

                  let txnStock = log.stock !== undefined ? log.stock : Math.abs(diff);
                  if (cleanType === "item" && prev === 0 && curr > 0) {
                    txnStock = curr;
                  }

                  const balance = log.balance !== undefined ? log.balance : curr;

                  return (
                    <TableRow key={log._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/50">
                      <TableCell className="text-xs text-gray-500">
                        {(currentPage - 1) * resultsPerPage + index + 1}
                      </TableCell>

                      {/* Item Name */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleOpenItemHistory(log)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1">
                            {log.item_name}
                            <FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                          </span>
                          {log.alias && (
                            <span className="block text-xs text-gray-400">
                              Alias: {log.alias}
                            </span>
                          )}
                        </button>
                      </TableCell>

                      {/* Item Code */}
                      <TableCell className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300">
                        {log.item_code || "—"}
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${conf.badge}`}>
                          {cleanType}
                        </span>
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-right">
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${cleanType === "sale"
                              ? "text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300"
                              : cleanType === "stock"
                                ? "text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300"
                                : "text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}
                        >
                          {txnStock}
                        </span>
                      </TableCell>

                      {/* Balance */}
                      <TableCell className="text-right text-sm font-bold font-mono text-gray-900 dark:text-white">
                        {balance}
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        <div>{dayjs(log.createdAt).format("DD/MM/YYYY")}</div>
                        <div className="text-[10px] text-gray-400">{dayjs(log.createdAt).format("hh:mm A")}</div>
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="text-xs text-gray-600 dark:text-gray-300 max-w-[180px] truncate" title={log.notes}>
                        {log.notes || "—"}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenItemHistory(log)}
                          title="View Full History of this Item"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 border border-primary/20 transition-all hover:scale-105"
                        >
                          <FiClock className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TableFooter>
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                <span>Total {totalResults} record(s)</span>

                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    layout="outline"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="small"
                    layout="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TableFooter>
          </TableContainer>
        )}
      </AnimatedContent>
    </>
  );
};

export default Inventory;
