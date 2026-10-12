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
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus } from "react-icons/fi";

import MainDrawer from "@/components/drawer/MainDrawer";
import CustomerDrawer from "@/components/drawer/CustomerDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import CustomerTable from "@/components/customer/CustomerTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AnimatedContent from "@/components/common/AnimatedContent";
import CustomerServices from "@/services/CustomerServices";
import { notifySuccess, notifyError } from "@/utils/toast";

const Customers = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  // Get salesman_id from admin context
  const salesmanId = adminInfo?.salesman_id;
  // console.log('Current salesman ID:', salesmanId);


  const { toggleDrawer, lang } = useContext(SidebarContext);

  // Server-side pagination/search state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchCustomers = async (page = 1, limit = resultsPerPage, q = "") => {
    // Block unintended resets to page 1 unless explicitly allowed
    if (page === 1 && !allowPageOneRef.current) {
      console.log("Blocked unintended page=1 fetch");
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true); // removed console.log
    setError("");
    try {
      const { customers, totalDoc } = await CustomerServices.getAllCustomer({ page, limit, q, salesmanId });
      if (requestId !== requestIdRef.current) {
        console.log("fetchCustomers ignored stale response:", { page, limit, q, requestId, latest: requestIdRef.current });
        return;
      }
      setCustomers(customers);
      setTotalResults(totalDoc);
      // Keep per-page as the requested limit to avoid UI resets
      setResultsPerPage(limit);
      // Always respect the requested page to prevent unwanted resets
      setCurrentPage(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("fetchCustomers error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load customers";
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
    fetchCustomers(1, resultsPerPage, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { t } = useTranslation();

  const [syncLoading, setSyncLoading] = useState(false);

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
      fetchCustomers(1, resultsPerPage, q);
    }, 300);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const q = userRef.current?.value?.trim() || "";
    if (q === searchQuery) return;
    setSearchQuery(q);
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchCustomers(1, resultsPerPage, q);
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
    fetchCustomers(nextPage, resultsPerPage, searchQuery);
  };

  const handlePrevPage = () => {
    const prev = Math.max(1, Number(currentPage) - 1);
    if (prev === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handlePrevPage:", { from: currentPage, to: prev });
    setCurrentPage(prev);
    allowPageOneRef.current = prev === 1;
    fetchCustomers(prev, resultsPerPage, searchQuery);
  };

  const handleNextPage = () => {
    const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
    const next = Math.min(totalPages, Number(currentPage) + 1);
    if (next === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handleNextPage:", { from: currentPage, to: next, totalPages });
    setCurrentPage(next);
    allowPageOneRef.current = next === 1;
    fetchCustomers(next, resultsPerPage, searchQuery);
  };

  // handle reset field
  const handleResetField = () => {
    setSearchQuery("");
    userRef.current.value = "";
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchCustomers(1, resultsPerPage, "");
  };
  const refreshCustomer = async () => {
    try {
      setSyncLoading(true);
      const res = await CustomerServices.refreshCustomer();
      notifySuccess(res.message);
      // Refresh the list after sync
      fetchCustomers(currentPage, resultsPerPage, searchQuery);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync customers';
      notifyError(errorMessage);
    } finally {
      setSyncLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
  const startPage = Math.max(1, Number(currentPage) - 1);
  const endPage = Math.min(totalPages, Number(currentPage) + 1);


  return (
    <>
      <PageTitle>{t("Vendor")}</PageTitle>
      <MainDrawer product={true}>
        <CustomerDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody className="p-3 sm:p-4">
            <form
              onSubmit={handleSubmitUser}
              className="py-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4"
            >
              <div className="flex-1 w-full min-w-0 sm:max-w-md lg:max-w-lg">
                <Input
                  ref={userRef}
                  type="search"
                  name="search"
                  placeholder={t("Search Vendor")}
                  onChange={onSearchChange}
                  className="page-search-input w-full"
                />
              </div>

              <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto flex-shrink-0">
                <Button
                  type="submit"
                  className="h-9 sm:h-10 px-2 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all flex items-center justify-center"
                >
                  Search
                </Button>

                <Button
                  onClick={toggleDrawer}
                  className="h-9 sm:h-10 px-1.5 sm:px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center justify-center transition-all whitespace-nowrap"
                >
                  <span className="hidden sm:inline mr-1.5">
                    <FiPlus />
                  </span>
                  <span className="truncate">{t("Add Vendor")}</span>
                </Button>

                <Button
                  disabled={syncLoading}
                  onClick={refreshCustomer}
                  type="button"
                  className="btn-action-sync h-9 sm:h-10 px-2 sm:px-4 flex items-center justify-center text-xs sm:text-sm"
                >
                  <span>{syncLoading ? "..." : "Sync"}</span>
                </Button>

                <Button
                  onClick={handleResetField}
                  type="reset"
                  className="btn-action-reset h-9 sm:h-10 px-2 sm:px-4 flex items-center justify-center text-xs sm:text-sm"
                >
                  <span>Reset</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </AnimatedContent>

      {loading ? (
        // <Loading loading={loading} />
        <TableLoading row={12} col={6} width={190} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : customers?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-b-lg">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("CustomersId")}</TableCell>
                <TableCell>{t("CustomersJoiningDate")}</TableCell>
                <TableCell>{t("CustomersName")}</TableCell>
                <TableCell>{t("CustomersEmail")}</TableCell>
                <TableCell>{t("CustomersPhone")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-right">
                  {t("CustomersActions")}
                </TableCell>
              </tr>
            </TableHeader>
            <CustomerTable customers={customers} />
          </Table>
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
        <NotFound title="Sorry, There are no customers right now." />
      )}
    </>
  );
};

export default Customers;
