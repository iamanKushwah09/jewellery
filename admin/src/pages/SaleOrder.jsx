import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiFilter, FiX } from "react-icons/fi";
import MainDrawer from "@/components/drawer/MainDrawer";
import SaleOrderDrawer from "@/components/drawer/SaleOrderDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AnimatedContent from "@/components/common/AnimatedContent";
import SaleOrderServices from "@/services/SaleOrderServices";
import SaleOrderTable from "@/components/saleorder/SaleorderTable";

const SaleOrder = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang, isUpdate, setIsUpdate } = useContext(SidebarContext);

  // Server-side state
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [totalResults, setTotalResults] = useState(0);

  // Search and Filter states
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [isFiltering, setIsFiltering] = useState(false);

  // Race condition protection
  const requestIdRef = useRef(0);
  const hasFetchedRef = useRef(false);

  const { t } = useTranslation();

  // Production-grade server-side fetcher
  const fetchSaleOrders = async (
    page = 1,
    limit = resultsPerPage,
    search = searchQuery,
    dates = dateFilters
  ) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit,
        search: search || "",
        startDate: dates?.startDate || "",
        endDate: dates?.endDate || "",
      };

      const res = await SaleOrderServices.getAllSaleOrder(params);

      // Ignore stale responses
      if (requestId !== requestIdRef.current) return;

      if (res && res.orders) {
        setSaleOrders(res.orders);
        setTotalResults(res.totalOrders || 0);
        setCurrentPage(page);
        setResultsPerPage(limit);
      } else if (Array.isArray(res)) {
        setSaleOrders(res);
        setTotalResults(res.length);
        setCurrentPage(page);
      } else {
        setSaleOrders([]);
        setTotalResults(0);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("fetchSaleOrders error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load sale orders";
      setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setIsFiltering(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchSaleOrders(1, resultsPerPage, "");
  }, []);

  // Auto-refresh when an order is created, updated, dispatched, or deleted
  useEffect(() => {
    if (isUpdate) {
      fetchSaleOrders(currentPage, resultsPerPage, searchQuery, dateFilters);
      setIsUpdate(false);
    }
  }, [isUpdate]);

  const totalPages = Math.max(
    1,
    Math.ceil((totalResults || 0) / (resultsPerPage || 1))
  );
  const startPage = Math.max(1, Number(currentPage) - 2);
  const endPage = Math.min(totalPages, Number(currentPage) + 2);

  // Page change handlers
  const handleChangePage = (p) => {
    const nextPage = Number(p);
    if (!nextPage || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    fetchSaleOrders(nextPage, resultsPerPage, searchQuery, dateFilters);
  };

  const handlePrevPage = () => {
    const prev = Math.max(1, Number(currentPage) - 1);
    if (prev === currentPage) return;
    setCurrentPage(prev);
    fetchSaleOrders(prev, resultsPerPage, searchQuery, dateFilters);
  };

  const handleNextPage = () => {
    const next = Math.min(totalPages, Number(currentPage) + 1);
    if (next === currentPage) return;
    setCurrentPage(next);
    fetchSaleOrders(next, resultsPerPage, searchQuery, dateFilters);
  };

  // Search submission handler
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchInputRef.current?.value || "";
    setSearchQuery(query);
    setCurrentPage(1);
    fetchSaleOrders(1, resultsPerPage, query, dateFilters);
  };

  // Date filter handler
  const handleDateFilter = (e) => {
    if (e) e.preventDefault();
    setIsFiltering(true);
    setCurrentPage(1);
    fetchSaleOrders(1, resultsPerPage, searchQuery, dateFilters);
  };

  // Clear date filters
  const clearDateFilters = () => {
    const emptyDates = { startDate: "", endDate: "" };
    setDateFilters(emptyDates);
    setCurrentPage(1);
    fetchSaleOrders(1, resultsPerPage, searchQuery, emptyDates);
  };

  // Reset all filters and search
  const handleResetField = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setSearchQuery("");
    const emptyDates = { startDate: "", endDate: "" };
    setDateFilters(emptyDates);
    setCurrentPage(1);
    fetchSaleOrders(1, resultsPerPage, "", emptyDates);
  };

  return (
    <>
      <PageTitle>{t("SaleOrder")}</PageTitle>
      <MainDrawer product={true}>
        <SaleOrderDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody className="p-3 sm:p-4">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <div className="flex-1 w-full min-w-0">
                  <Input
                    ref={searchInputRef}
                    type="search"
                    name="search"
                    placeholder="Search by Voucher, Customer, Mobile, GST..."
                    className="page-search-input w-full"
                  />
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
                  <Button
                    type="submit"
                    className="h-9 sm:h-10 px-2 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all flex items-center justify-center"
                  >
                    Search
                  </Button>
                  <Button
                    onClick={toggleDrawer}
                    className="h-9 sm:h-10 px-2 sm:px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center justify-center transition-all whitespace-nowrap"
                  >
                    <span className="mr-1 sm:mr-2">
                      <FiPlus />
                    </span>
                    <span className="truncate">{t("Add Sale Order")}</span>
                  </Button>
                  <Button
                    onClick={handleResetField}
                    type="button"
                    className="btn-action-reset h-9 sm:h-10 px-2 sm:px-4 flex items-center justify-center text-xs sm:text-sm"
                  >
                    <span>Reset</span>
                  </Button>
                </div>
              </div>

              {/* Compact Date Filter Row */}
              <div className="pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                    <FiFilter className="w-3.5 h-3.5 text-primary" />
                    <span>Date Range:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center flex-1 sm:flex sm:items-center min-w-0">
                    <Input
                      type="date"
                      value={dateFilters.startDate}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full flex-1 h-9 sm:h-10 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm min-w-0"
                      title="Start Date"
                    />
                    <span className="hidden sm:inline text-xs text-gray-400 font-medium flex-shrink-0">
                      to
                    </span>
                    <Input
                      type="date"
                      value={dateFilters.endDate}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full flex-1 h-9 sm:h-10 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm min-w-0"
                      title="End Date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                  <Button
                    onClick={handleDateFilter}
                    disabled={
                      isFiltering ||
                      (!dateFilters.startDate && !dateFilters.endDate)
                    }
                    className="h-9 sm:h-10 px-3 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium transition-all flex items-center justify-center w-full sm:w-auto"
                  >
                    <FiFilter className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{isFiltering ? "Filtering..." : "Apply Filter"}</span>
                  </Button>

                  <Button
                    onClick={clearDateFilters}
                    layout="outline"
                    className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-danger hover:text-danger text-xs sm:text-sm font-medium transition-all flex items-center justify-center w-full sm:w-auto"
                    disabled={isFiltering}
                  >
                    <FiX className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">Clear Dates</span>
                  </Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </AnimatedContent>

      {loading ? (
        <TableLoading row={10} col={9} message="Loading sales orders & customer records..." />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : (
        <>
          {saleOrders?.length !== 0 ? (
            <TableContainer className="mb-8 rounded-b-lg">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>{t("voucherNo")}</TableCell>
                    <TableCell>Group Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>{t("CreateDate")}</TableCell>
                    <TableCell>{t("SaleType")}</TableCell>
                    <TableCell>{t("Party")}</TableCell>
                    <TableCell>{t("Saleman")}</TableCell>
                    <TableCell>{t("ACTIVE")}</TableCell>
                    <TableCell className="text-right">{t("Action")}</TableCell>
                  </tr>
                </TableHeader>
                <SaleOrderTable
                  dataTable={saleOrders}
                  showFilters={false}
                />
              </Table>
              <TableFooter>
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2">
                  <div className="text-sm">
                    {totalResults > 0 ? (
                      <span>
                        Showing{" "}
                        {Math.min(
                          (currentPage - 1) * resultsPerPage + 1,
                          totalResults
                        )}
                        -{Math.min(currentPage * resultsPerPage, totalResults)} of{" "}
                        {totalResults}
                      </span>
                    ) : (
                      <span>Showing 0 of 0</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                    <Button
                      layout="outline"
                      size="small"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="!px-2 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm"
                    >
                      Prev
                    </Button>
                    <Button
                      layout="outline"
                      size="small"
                      onClick={() => handleChangePage(1)}
                      className={`!px-2 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                        currentPage === 1
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium"
                          : ""
                      }`}
                    >
                      1
                    </Button>
                    {startPage > 2 && <span className="px-1 text-xs">...</span>}
                    {Array.from(
                      { length: Math.max(0, endPage - startPage + 1) },
                      (_, idx) => {
                        const p = startPage + idx;
                        if (p <= 1 || p >= totalPages) return null;
                        return (
                          <Button
                            key={`p-${p}`}
                            layout="outline"
                            size="small"
                            onClick={() => handleChangePage(p)}
                            className={`!px-2 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                              currentPage === p
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium"
                                : ""
                            }`}
                          >
                            {p}
                          </Button>
                        );
                      }
                    )}
                    {endPage < totalPages - 1 && (
                      <span className="px-1 text-xs">...</span>
                    )}
                    {totalPages > 1 && (
                      <Button
                        layout="outline"
                        size="small"
                        onClick={() => handleChangePage(totalPages)}
                        className={`!px-2 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                          currentPage === totalPages
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium"
                            : ""
                        }`}
                      >
                        {totalPages}
                      </Button>
                    )}
                    <Button
                      layout="outline"
                      size="small"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="!px-2 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TableFooter>
            </TableContainer>
          ) : (
            <NotFound
              title={
                dateFilters.startDate || dateFilters.endDate
                  ? "No sale orders found for the selected date range"
                  : searchQuery
                  ? `No sale orders found matching "${searchQuery}"`
                  : "Sorry, There are no sale orders right now."
              }
            />
          )}
        </>
      )}
    </>
  );
};

export default SaleOrder;
