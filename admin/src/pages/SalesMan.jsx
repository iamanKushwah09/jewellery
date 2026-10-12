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
import SaleManDrawer from "@/components/drawer/SaleManDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import SaleManTable from "@/components/saleman/SaleManTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AnimatedContent from "@/components/common/AnimatedContent";
import SalesmanServices from "@/services/SalesmanServices";
import { notifySuccess, notifyError } from "@/utils/toast";

const SalesMan = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);

  // Server-side pagination/search state
  const [salesmans, setSalesmans] = useState([]);
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

  const fetchSalesmans = async (page = 1, limit = resultsPerPage, q = "") => {
    if (page === 1 && !allowPageOneRef.current) {
      // Block unintended resets to page 1 unless explicitly allowed
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const { salesmans, totalDoc } = await SalesmanServices.getAllSalesman({
        page,
        limit,
        q,
        email: adminInfo.email,
      });
      if (requestId !== requestIdRef.current) return;
      setSalesmans(salesmans);
      setTotalResults(totalDoc);
      setResultsPerPage(limit);
      setCurrentPage(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load salesmans";
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
    fetchSalesmans(1, resultsPerPage, "");
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
      if (q === searchQuery) return;
      setSearchQuery(q);
      setCurrentPage(1);
      allowPageOneRef.current = true;
      fetchSalesmans(1, resultsPerPage, q);
    }, 300);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const q = userRef.current?.value?.trim() || "";
    if (q === searchQuery) return;
    setSearchQuery(q);
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchSalesmans(1, resultsPerPage, q);
  };

  const handleChangePage = (p) => {
    const incoming =
      typeof p === "number"
        ? p
        : p && typeof p === "object"
        ? Number(p.page ?? p.target?.value ?? NaN)
        : Number(p);

    const nextPage = Number.isInteger(incoming) && incoming > 0 ? incoming : NaN;

    if (Number.isNaN(nextPage)) {
      return;
    }

    if (nextPage === currentPage) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setCurrentPage(nextPage);
    allowPageOneRef.current = nextPage === 1;
    fetchSalesmans(nextPage, resultsPerPage, searchQuery);
  };

  const handlePrevPage = () => {
    const prev = Math.max(1, Number(currentPage) - 1);
    if (prev === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCurrentPage(prev);
    allowPageOneRef.current = prev === 1;
    fetchSalesmans(prev, resultsPerPage, searchQuery);
  };

  const handleNextPage = () => {
    const totalPages = Math.max(
      1,
      Math.ceil((totalResults || 0) / (resultsPerPage || 1))
    );
    const next = Math.min(totalPages, Number(currentPage) + 1);
    if (next === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCurrentPage(next);
    allowPageOneRef.current = next === 1;
    fetchSalesmans(next, resultsPerPage, searchQuery);
  };

  // handle reset field
  const handleResetField = () => {
    setSearchQuery("");
    userRef.current.value = "";
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchSalesmans(1, resultsPerPage, "");
  };

  const refreshSales = async () => {
    setSyncLoading(true);
    try {
      const res = await SalesmanServices.refresh();
      notifySuccess(res.message);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to sync salesmans";
      notifyError(errorMessage);
    } finally {
      setSyncLoading(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil((totalResults || 0) / (resultsPerPage || 1))
  );
  const startPage = Math.max(1, Number(currentPage) - 1);
  const endPage = Math.min(totalPages, Number(currentPage) + 1);

  return (
    <>
      <PageTitle>{t("Sales Man")} </PageTitle>
      <MainDrawer>
        <SaleManDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={handleSubmitUser}
              className="py-3 flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch md:items-center gap-3 md:gap-4"
            >
              <div className="flex-1 min-w-[200px] max-w-sm sm:max-w-md w-full">
                <Input
                  ref={userRef}
                  type="search"
                  name="search"
                  placeholder={t("Search Salesman")}
                  onChange={onSearchChange}
                  className="page-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all"
                >
                  Search
                </Button>

                <Button
                  onClick={toggleDrawer}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center transition-all"
                >
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  {t("Add Salesman")}
                </Button>

                <Button
                  disabled={syncLoading}
                  onClick={refreshSales}
                  type="button"
                  className="btn-action-sync"
                >
                  <span>{syncLoading ? "Syncing..." : "Sync"}</span>
                </Button>

                <Button
                  onClick={handleResetField}
                  type="reset"
                  className="btn-action-reset"
                >
                  <span>Reset</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </AnimatedContent>
      {loading ? (
        <TableLoading row={12} col={7} width={163} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : salesmans?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-b-lg">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("Description")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-right">
                  {t("Actions")}
                </TableCell>
              </tr>
            </TableHeader>
            <SaleManTable dataTable={salesmans} lang={lang} />
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
        <NotFound title="Salesman" />
      )}
    </>
  );
};

export default SalesMan;
