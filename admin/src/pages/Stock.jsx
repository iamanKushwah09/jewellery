import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Select,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import { useContext , useState , useRef , useEffect  } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiRotateCw, FiRefreshCw } from "react-icons/fi";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import TableLoading from "@/components/preloader/TableLoading";
// import StockTable from "@/components/stockTable/StockTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import BannerServices from "@/services/BannerServices";
import StockTable from "@/components/stock/StockTable";
import ItemServices from "@/services/ItemServices";
import AnimatedContent from "@/components/common/AnimatedContent";

const Stock = () => {

  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [totalResults, setTotalResults] = useState(0);
  const userRef = useRef("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const debounceRef = useRef();
  // Guards to avoid duplicate/stale updates
  const hasFetchedRef = useRef(false);
  const requestIdRef = useRef(0);
  const allowPageOneRef = useRef(true);
  const { toggleModal } = useContext(SidebarContext);
  const { t } = useTranslation();

  // // handle reset filed
  // const handleResetField = () => {
  //   setRole("");
  //   userRef.current.value = "";
  // };
  const fetchItems = async (page = 1, limit = resultsPerPage, q = "") => {
    // Block unintended resets to page 1 unless explicitly allowed
    if (page === 1 && !allowPageOneRef.current) {
      console.log("Blocked unintended page=1 fetch");
      return;
    }
    const requestId = ++requestIdRef.current;
    console.log("fetchItems called:", { page, limit, q, requestId });
    setLoading(true);
    setError("");
    try {
      const { items, totalDoc/*, limits, pages*/ } = await ItemServices.getAllItem({ page, limit, q });
      if (requestId !== requestIdRef.current) {
        console.log("fetchItems ignored stale response:", { page, limit, q, requestId, latest: requestIdRef.current });
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
      const errorMessage = err.response?.data?.message || err.message || "Failed to load items";
      setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchItems(1, resultsPerPage, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStockLoading, setSyncStockLoading] = useState(false);
  // handle reset filed
  const handleResetField = () => {
    setSearchQuery("");
    setRawQuery("");
    if (userRef.current) userRef.current.value = "";
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItems(1, resultsPerPage, "");
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync items';
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync stock';
      notifyError(errorMessage);
    } finally {
      setSyncStockLoading(false);
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
  
      const nextPage = Number.isInteger(incoming) && incoming > 0 ? incoming : NaN;
  
      if (Number.isNaN(nextPage)) {
        console.warn("handleChangePage received invalid page:", p);
        return;
      }
  
      if (nextPage === currentPage) return;
  
      if (debounceRef.current) clearTimeout(debounceRef.current);
  
      console.log("handleChangePage:", { from: currentPage, to: nextPage, perPage: resultsPerPage, q: searchQuery });
  
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
      const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
      const next = Math.min(totalPages, Number(currentPage) + 1);
      if (next === currentPage) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      console.log("handleNextPage:", { from: currentPage, to: next, totalPages });
      setCurrentPage(next);
      allowPageOneRef.current = next === 1;
      fetchItems(next, resultsPerPage, searchQuery);
    };
    // ---- end replacements ----
  

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
  const startPage = Math.max(1, Number(currentPage) - 1);
  const endPage = Math.min(totalPages, Number(currentPage) + 1);



  return (
    <>
      <PageTitle>{t("Stock")} </PageTitle>
      <AnimatedContent>
          <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <form
                onSubmit={handleSubmitUser}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="flex-1 w-full min-w-[200px]">
                  <Input
                    ref={userRef}
                    type="search"
                    name="search"
                    placeholder={t("Search by Item Name, Code, or Alias...")}
                    className="page-search-input h-10 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <Button
                    type="submit"
                    className="h-10 px-5 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-sm font-medium transition-all flex items-center"
                  >
                    <FiSearch className="mr-1.5" />
                    {t("Search")}
                  </Button>

                  <Button
                    onClick={syncStock}
                    disabled={syncStockLoading}
                    type="button"
                    className="h-10 px-4 rounded-lg bg-[#845adf] hover:bg-[#7248cf] text-white text-sm font-medium shadow-button flex items-center transition-all"
                  >
                    <FiRefreshCw className={`mr-1.5 ${syncStockLoading ? "animate-spin" : ""}`} />
                    {syncStockLoading ? t("Syncing...") : t("Sync Stock")}
                  </Button>

                  <Button
                    onClick={handleResetField}
                    type="reset"
                    className="btn-action-reset h-10 px-4 text-sm flex items-center"
                  >
                    <FiRotateCw className="mr-1.5" />
                    <span>{t("Reset")}</span>
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </AnimatedContent>
      {loading ? (
        // <Loading loading={loading} />
        <TableLoading row={12} col={7} width={163} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : items?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("Stock")}</TableCell>
                <TableCell>{t("Alias")}</TableCell>
                <TableCell>{t("Category")}</TableCell>
                <TableCell>{t("Item group")}</TableCell>
                <TableCell>{t("Brand")}</TableCell>
                <TableCell>{t("Unit")}</TableCell>
                <TableCell>{t("Alternate unit")}</TableCell>
                {/* <TableCell>{t("Conversion factor")}</TableCell> */}
                {/* <TableCell>{t("Tax GST")}</TableCell> */}
                {/* <TableCell>{t("HSN Code")}</TableCell> */}
                <TableCell>{t("Sale Price")}</TableCell>
                <TableCell>{t("MRP")}</TableCell>
                {/* <TableCell>{t("Discount")}</TableCell> */}
                {/* <TableCell>{t("Vendor Discount")}</TableCell> */}
                {/* <TableCell>{t("Specification")}</TableCell> */}
                {/* <TableCell>{t("Short description")}</TableCell> */}
                {/* <TableCell>{t("Long description")}</TableCell> */}
                <TableCell className="text-center">{"View"}</TableCell>
                {/* <TableCell className="text-right">
                  {t("Actions")}
                </TableCell> */}
              </tr>
            </TableHeader>
            <StockTable
              dataTable={items}
              lang={lang}
              isShow={false}
              onStockUpdated={() => fetchItems(currentPage, resultsPerPage, searchQuery)}
            />
          </Table>
          {/* <TableFooter>
            <Pagination
              totalResults={totalResults}
              resultsPerPage={resultsPerPage}
              onChange={handleChangePage}
              label="Table navigation"
            />
          </TableFooter> */}
          <TableFooter>
            <div className="w-full flex items-center justify-center sm:justify-between px-4 py-2">
              <div className="text-sm hidden sm:block">
                {totalResults > 0 ? (
                  <span>
                    Showing {Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)}-
                    {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                  </span>
                ) : (
                  <span>Showing 0 of 0</span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-2">
                <Button
                  layout="outline"
                  size="small"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="!px-1.5 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm"
                >
                  Prev
                </Button>
                {startPage > 1 && (
                  <>
                    <Button
                      layout="outline"
                      size="small"
                      onClick={() => handleChangePage(1)}
                      className={`!px-1.5 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                        currentPage === 1 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-300 font-medium" : ""
                      }`}
                    >
                      1
                    </Button>
                    {startPage > 2 && <span className="px-0.5">...</span>}
                  </>
                )}
                {Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, idx) => {
                  const p = startPage + idx;
                  if ((p === 1 && startPage > 1) || (p === totalPages && endPage < totalPages)) return null;
                  return (
                    <Button
                      key={`p-${p}`}
                      layout="outline"
                      size="small"
                      onClick={() => handleChangePage(p)}
                      className={`!px-1.5 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                        currentPage === p ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-300 font-medium" : ""
                      }`}
                    >
                      {p}
                    </Button>
                  );
                })}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="px-0.5">...</span>}
                    <Button
                      layout="outline"
                      size="small"
                      onClick={() => handleChangePage(totalPages)}
                      className={`!px-1.5 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm ${
                        currentPage === totalPages ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-300 font-medium" : ""
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
                  className="!px-1.5 !py-1 text-xs sm:!px-3 sm:!py-1.5 sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </TableFooter>
        </TableContainer>
      ) : (
        <NotFound title="Stock" />
      )}
    </>
  );
};

export default Stock;
