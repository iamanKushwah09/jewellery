import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiFilter, FiChevronDown, FiSearch } from "react-icons/fi";
import MainDrawer from "@/components/drawer/MainDrawer";
import ItemDrawer from "@/components/drawer/ItemDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import ItemTable from "@/components/item/itemTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import ItemServices from "@/services/ItemServices";
import GmcServices from "@/services/GmcServices";
import AnimatedContent from "@/components/common/AnimatedContent";
import { notifySuccess, notifyError } from "@/utils/toast";
// import ConfirmDialog from "@/components/common/ConfirmDialog";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import SelectItemGroupFilter from "@/components/form/selectOption/SelectItemGroupFilter";
import SelectCategoryFilter from "@/components/form/selectOption/SelectCategoryFilter";

const Item = () => {

  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang, isUpdate, setIsUpdate } = useContext(SidebarContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // Server-side pagination/search state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [totalResults, setTotalResults] = useState(0);
  const userRef = useRef("");
  const [searchQuery, setSearchQuery] = useState("");
  // Debounced typing state
  const [rawQuery, setRawQuery] = useState("");
  const debounceRef = useRef();
  // Guards to avoid duplicate/stale updates
  const hasFetchedRef = useRef(false);
  const requestIdRef = useRef(0);
  const allowPageOneRef = useRef(true);

  // Filter states
  const [filters, setFilters] = useState({
    itemGroup: "",
    category: "",
    stockMin: "",
    stockMax: ""
  });

  const fetchItems = async (page = 1, limit = resultsPerPage, q = "", activeFilters = filters) => {
    // Block unintended resets to page 1 unless explicitly allowed
    if (page === 1 && !allowPageOneRef.current) {
      console.log("Blocked unintended page=1 fetch");
      return;
    }
    const requestId = ++requestIdRef.current;
    const currentFilters = activeFilters !== undefined ? activeFilters : filters;
    console.log("fetchItems called:", { page, limit, q, requestId, filters: currentFilters });
    setLoading(true);
    setError("");
    try {
      const { items, totalDoc /*, limits, pages*/ } =
        await ItemServices.getAllItem({ page, limit, q, ...currentFilters });
      if (requestId !== requestIdRef.current) {
        console.log("fetchItems ignored stale response:", {
          page,
          limit,
          q,
          requestId,
          latest: requestIdRef.current,
        });
        return;
      }
      setItems(items);
      setTotalResults(totalDoc);
      // Keep per-page as the requested limit to avoid UI resets
      setResultsPerPage(limit);
      // Always respect the requested page to prevent unwanted resets
      setCurrentPage(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("fetchItems error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load items";
      setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (field, selectedOption) => {
    // Extract the label (display name) from the selected option object for dropdowns, or use the value directly for other inputs
    const isDropdownField = field === 'itemGroup' || field === 'category';
    const value = isDropdownField ? (selectedOption?.label || selectedOption || "") : (selectedOption?.value || selectedOption || "");
    const newFilters = { ...filters, [field]: value };
    console.log(newFilters, 'newFiltersnewFiltersnewFiltersnewFiltersnewFiltersnewFiltersnewFiltersnewFiltersnewFiltersnewFilters')
    setFilters(newFilters);
    console.log('Filter changed:', field, selectedOption, newFilters);
    // Don't apply filters immediately - only update the state
  };

  const applyFilters = () => {
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItems(1, resultsPerPage, searchQuery, filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      itemGroup: "",
      category: "",
      stockMin: "",
      stockMax: ""
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItems(1, resultsPerPage, searchQuery, emptyFilters);
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchItems(1, resultsPerPage, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isUpdate) {
      allowPageOneRef.current = true;
      fetchItems(currentPage, resultsPerPage, searchQuery, filters);
      setIsUpdate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdate]);

  const { toggleModal } = useContext(SidebarContext);
  const { t } = useTranslation();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStockLoading, setSyncStockLoading] = useState(false);
  const [gmcSyncLoading, setGmcSyncLoading] = useState(false);
  // handle reset field
  const handleResetField = () => {
    setSearchQuery("");
    setRawQuery("");
    if (userRef.current) userRef.current.value = "";
    clearFilters();
  };

  const deleteAllItems = async () => {
    try {
      await ItemServices.deleteAllItems();
      notifySuccess("All items deleted successfully");
      fetchItems(currentPage, resultsPerPage, searchQuery);
    } catch (err) {
      console.error("Error deleting all items:", err);
      notifyError("Something went wrong");
    }
  };

  // Optionally, you can refresh the item list after deletion

  const syncItem = async () => {
    setSyncLoading(true);
    try {
      const res = await ItemServices.syncItem();
      notifySuccess(res.message);
      fetchItems(currentPage, resultsPerPage, searchQuery);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to sync items";
      notifyError(errorMessage);
    } finally {
      setSyncLoading(false);
    }
  };

  const syncStock = async () => {
    setSyncStockLoading(true);
    try {
      const res = await ItemServices.syncStock();
      notifySuccess(`Stock sync completed: ${res.updated} items updated`);
      fetchItems(currentPage, resultsPerPage, searchQuery);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to sync stock";
      notifyError(errorMessage);
    } finally {
      setSyncStockLoading(false);
    }
  };

  const syncAllGMC = async () => {
    setGmcSyncLoading(true);
    try {
      await GmcServices.syncAllProducts();
      notifySuccess("GMC batch synchronization started in background!");
      setTimeout(() => {
        fetchItems(currentPage, resultsPerPage, searchQuery);
      }, 1500);
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || "Failed to start GMC sync");
    } finally {
      setGmcSyncLoading(false);
    }
  };

  // Debounced search as-you-type
  const onSearchChange = (e) => {
    const value = e.target.value;
    setRawQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = value.trim();
      // Avoid redundant fetch if unchanged
      if (q === searchQuery) return;
      setSearchQuery(q);
      setCurrentPage(1);
      allowPageOneRef.current = true;
      fetchItems(1, resultsPerPage, q);
    }, 300);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const q = userRef.current?.value?.trim() || "";
    if (q === searchQuery) return;
    setSearchQuery(q);
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItems(1, resultsPerPage, q);
  };

  const handleChangePage = (p) => {
    // coerce whatever we receive to a number (number/string/object)
    // Windmill usually sends a number, but be defensive.
    const incoming =
      typeof p === "number"
        ? p
        : p && typeof p === "object"
          ? // if it's an object with .page or a native event with target.value
          Number(p.page ?? p.target?.value ?? NaN)
          : Number(p);

    const nextPage =
      Number.isInteger(incoming) && incoming > 0 ? incoming : NaN;

    if (Number.isNaN(nextPage)) {
      console.warn("handleChangePage received invalid page:", p);
      return;
    }

    if (nextPage === currentPage) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    console.log("handleChangePage:", {
      from: currentPage,
      to: nextPage,
      perPage: resultsPerPage,
      q: searchQuery,
    });

    // update state and allow/reset page-one guard
    setCurrentPage(nextPage);
    allowPageOneRef.current = nextPage === 1;
    fetchItems(nextPage, resultsPerPage, searchQuery);
  };

  const handlePrevPage = () => {
    const prev = Math.max(1, Number(currentPage) - 1);
    if (prev === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handlePrevPage:", { from: currentPage, to: prev });
    setCurrentPage(prev);
    allowPageOneRef.current = prev === 1;
    fetchItems(prev, resultsPerPage, searchQuery);
  };

  const handleNextPage = () => {
    const totalPages = Math.max(
      1,
      Math.ceil((totalResults || 0) / (resultsPerPage || 1))
    );
    const next = Math.min(totalPages, Number(currentPage) + 1);
    if (next === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handleNextPage:", { from: currentPage, to: next, totalPages });
    setCurrentPage(next);
    allowPageOneRef.current = next === 1;
    fetchItems(next, resultsPerPage, searchQuery);
  };
  // ---- end replacements ----

  const totalPages = Math.max(
    1,
    Math.ceil((totalResults || 0) / (resultsPerPage || 1))
  );
  const startPage = Math.max(1, Number(currentPage) - 2);
  const endPage = Math.min(totalPages, Number(currentPage) + 2);

  return (
    <>
      <PageTitle>{t("Item")} </PageTitle>
      <MainDrawer product={true}>
        <ItemDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs bg-white dark:bg-gray-800 mb-5" style={{ overflow: 'visible' }}>
          <CardBody>
            {/* Filters Section */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-700 rounded-lg">
              <div
                className="flex items-center justify-between cursor-pointer sm:cursor-default"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                  <FiFilter className="text-primary w-4 h-4" />
                  <span>Filters</span>
                  {(filters.itemGroup || filters.category || filters.stockMin || filters.stockMax) && (
                    <span className="ml-1 text-[10px] sm:text-xs px-2 py-0.5 bg-primary/20 text-primary font-bold rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(filters.itemGroup || filters.category || filters.stockMin || filters.stockMax) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilters();
                      }}
                      className="text-xs text-red-500 hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    className="sm:hidden text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
                  >
                    <span>{showFilters ? "Hide" : "Show"}</span>
                    <FiChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className={`mt-3 sm:mt-4 ${showFilters ? "block" : "hidden sm:block"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4 items-end">
                  {/* Item Group Filter */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Group
                    </label>
                    <SelectItemGroupFilter
                      setRole={(selectedOption) => handleFilterChange('itemGroup', selectedOption)}
                      value={filters.itemGroup || ""}
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <SelectCategoryFilter
                      setRole={(selectedOption) => handleFilterChange('category', selectedOption)}
                      value={filters.category || ""}
                    />
                  </div>

                  {/* Stock Min Filter */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Min
                    </label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.stockMin}
                      onChange={(e) => handleFilterChange('stockMin', e.target.value)}
                      className="w-full text-xs sm:text-sm h-10"
                    />
                  </div>

                  {/* Stock Max Filter */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Max
                    </label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.stockMax}
                      onChange={(e) => handleFilterChange('stockMax', e.target.value)}
                      className="w-full text-xs sm:text-sm h-10"
                    />
                  </div>

                  {/* Apply Filters Button */}
                  <div className="col-span-1">
                    <Button
                      onClick={applyFilters}
                      className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center shadow-button transition-all"
                    >
                      <span className="block sm:hidden">Apply</span>
                      <span className="hidden sm:block">Apply Filters</span>
                    </Button>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="col-span-1">
                    <Button
                      onClick={clearFilters}
                      layout="outline"
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-danger hover:text-danger rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center transition-all"
                    >
                      <span className="block sm:hidden">Clear</span>
                      <span className="hidden sm:block">Clear Filters</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmitUser}
              className="py-1 flex flex-col xl:flex-row xl:items-center gap-2.5 2xl:gap-3"
            >
              {/* Search Bar - Expands smoothly to eliminate empty space */}
              <div className="w-full xl:flex-1 min-w-0">
                <div className="relative flex items-center w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-400 z-10">
                    <FiSearch className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    ref={userRef}
                    type="text"
                    name="search"
                    placeholder={t("Search Item")}
                    onChange={onSearchChange}
                    className="w-full h-10 rounded-lg text-xs sm:text-sm bg-white dark:bg-[#1a2352] border border-gray-200 dark:border-[#263168] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-all"
                    style={{ paddingLeft: "2.75rem", paddingRight: "1rem" }}
                  />
                  <button type="submit" className="hidden"></button>
                </div>
              </div>

              {/* Actions Toolbar - Fits on 1 row on Desktop (xl:flex-nowrap), 2-col grid on Mobile */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap xl:flex-nowrap items-center gap-1.5 2xl:gap-2 w-full xl:w-auto flex-shrink-0">
                {/* Sync Items Button */}
                <Button
                  onClick={syncItem}
                  disabled={syncLoading}
                  type="button"
                  className="btn-action-sync h-9 sm:h-10 !px-2 2xl:!px-3 flex items-center justify-center text-xs font-medium w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                >
                  <span>{syncLoading ? "Syncing..." : "Sync Items"}</span>
                </Button>

                {/* Sync Stock Button */}
                <Button
                  onClick={syncStock}
                  disabled={syncStockLoading}
                  type="button"
                  className="btn-action-sync h-9 sm:h-10 !px-2 2xl:!px-3 flex items-center justify-center text-xs font-medium w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                >
                  <span>{syncStockLoading ? "Syncing..." : "Sync Stock"}</span>
                </Button>

                {/* Sync All GMC Button */}
                <Button
                  onClick={syncAllGMC}
                  disabled={gmcSyncLoading}
                  type="button"
                  className="btn-action-outline-primary h-9 sm:h-10 !px-2 2xl:!px-3 flex items-center justify-center text-xs font-medium w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                >
                  <span>{gmcSyncLoading ? "Syncing GMC..." : "Sync to GMC"}</span>
                </Button>

                {/* Reset Button */}
                <Button
                  onClick={handleResetField}
                  type="reset"
                  className="btn-action-reset h-9 sm:h-10 !px-2.5 2xl:!px-3 flex items-center justify-center text-xs font-medium w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                >
                  Reset
                </Button>

                {/* Delete All Button */}
                <Button
                  onClick={() => setConfirmOpen(true)}
                  type="button"
                  className="btn-action-danger h-9 sm:h-10 !px-2 2xl:!px-3 flex items-center justify-center text-xs font-medium w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                >
                  <span>{t("Delete All")}</span>
                </Button>

                {/* Add Item Button (Primary Action) */}
                <Button
                  onClick={toggleDrawer}
                  type="button"
                  className="h-9 sm:h-10 !px-3 2xl:!px-4 bg-primary hover:bg-primary-hover shadow-button text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 w-full sm:w-auto transition-all whitespace-nowrap flex-shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>{t("Add Item")}</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </AnimatedContent>
      {loading ? (
        <TableLoading row={10} col={9} message="Loading inventory & catalog items..." />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : items?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-b-lg">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Image")}</TableCell>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("Alias")}</TableCell>
                <TableCell>{t("Category")}</TableCell>
                {/* <TableCell>{t("Brands")}</TableCell> */}
                <TableCell>{t("Item group")}</TableCell>
                <TableCell>{t("Unit")}</TableCell>
                {/* <TableCell>{t("Alternate unit")}</TableCell> */}
                {/* <TableCell>{t("Conversion factor")}</TableCell> */}
                {/* <TableCell>{t("Tax GST")}</TableCell> */}
                {/* <TableCell>{t("HSN Code")}</TableCell> */}
                <TableCell>{t("Sale Price")}</TableCell>
                <TableCell>{t("MRP")}</TableCell>
                <TableCell>{t("Stock")}</TableCell>
                {/* <TableCell>{t("Discount")}</TableCell> */}
                {/* <TableCell>{t("Vendor Discount")}</TableCe\ll> */}
                {/* <TableCell>{t("Specification")}</TableCell>
                <TableCell>{t("Short description")}</TableCell>
                <TableCell>{t("Long description")}</TableCell> */}
                <TableCell className="text-center">{t("Store Show")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-center">{t("GMC")}</TableCell>
                <TableCell className="action-col">{t("Actions")}</TableCell>
              </tr>
            </TableHeader>

            <ItemTable
              dataTable={items}
              lang={lang}
              onRefresh={() => fetchItems(currentPage, resultsPerPage, searchQuery)}
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
                    if (p === 1 || p === totalPages) return null;
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
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && (
                      <span className="px-1 text-xs">...</span>
                    )}
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
                  </>
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
        <NotFound title="Item" />
      )}
      <DeleteConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteAllItems();
          setConfirmOpen(false);
        }}
      />
    </>
  );
};

export default Item;
