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
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus } from "react-icons/fi";
import MainDrawer from "@/components/drawer/MainDrawer";
import ItemGroupDrawer from "@/components/drawer/ItemGroupDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import ItemGroupTable from "@/components/itemgroup/itemGroupTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AnimatedContent from "@/components/common/AnimatedContent";
import ItemGroupServices from "@/services/ItemGroupServices";
import { notifySuccess, notifyError } from "@/utils/toast";

const ItemGroup = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang, isUpdate, setIsUpdate } = useContext(SidebarContext);
  // Server-side pagination/search state
  const [itemGroups, setItemGroups] = useState([]);
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
  const fetchItemGroups = async (page = 1, limit = resultsPerPage, q = "") => {
    // Block unintended resets to page 1 unless explicitly allowed
    if (page === 1 && !allowPageOneRef.current) {
      console.log("Blocked unintended page=1 fetch");
      return;
    }
    const requestId = ++requestIdRef.current;
    console.log("fetchItemGroups called:", { page, limit, q, requestId });
    setLoading(true);
    setError("");
    try {
      const { itemGroups, totalDoc } = await ItemGroupServices.getAllItemGroup({ page, limit, q });
      if (requestId !== requestIdRef.current) {
        console.log("fetchItemGroups ignored stale response:", { page, limit, q, requestId, latest: requestIdRef.current });
        return;
      }
      setItemGroups(itemGroups);
      setTotalResults(totalDoc);
      // Keep per-page as the requested limit to avoid UI resets
      setResultsPerPage(limit);
      // Always respect the requested page to prevent unwanted resets
      setCurrentPage(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("fetchItemGroups error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load item groups";
      setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isUpdate) {
      allowPageOneRef.current = true;
      fetchItemGroups(currentPage, resultsPerPage, searchQuery);
      setIsUpdate(false);
    }
  }, [isUpdate, currentPage, resultsPerPage, searchQuery, setIsUpdate]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchItemGroups(1, resultsPerPage, "");
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
      fetchItemGroups(1, resultsPerPage, q);
    }, 300);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const q = userRef.current?.value?.trim() || "";
    if (q === searchQuery) return;
    setSearchQuery(q);
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItemGroups(1, resultsPerPage, q);
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
    fetchItemGroups(nextPage, resultsPerPage, searchQuery);
  };

  const handlePrevPage = () => {
    const prev = Math.max(1, Number(currentPage) - 1);
    if (prev === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handlePrevPage:", { from: currentPage, to: prev });
    setCurrentPage(prev);
    allowPageOneRef.current = prev === 1;
    fetchItemGroups(prev, resultsPerPage, searchQuery);
  };

  const handleNextPage = () => {
    const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
    const next = Math.min(totalPages, Number(currentPage) + 1);
    if (next === currentPage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    console.log("handleNextPage:", { from: currentPage, to: next, totalPages });
    setCurrentPage(next);
    allowPageOneRef.current = next === 1;
    fetchItemGroups(next, resultsPerPage, searchQuery);
  };

  // handle reset field
  const handleResetField = () => {
    setSearchQuery("");
    userRef.current.value = "";
    setCurrentPage(1);
    allowPageOneRef.current = true;
    fetchItemGroups(1, resultsPerPage, "");
  };

  const syncItemGroup = async () => {
    setSyncLoading(true);
    try {
      const res = await ItemGroupServices.syncItemGroup();
      notifySuccess(res.message);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to sync item groups";
      notifyError(errorMessage);
    } finally {
      setSyncLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / (resultsPerPage || 1)));
  const startPage = Math.max(1, Number(currentPage) - 2);
  const endPage = Math.min(totalPages, Number(currentPage) + 2);

  return (
    <>
      <PageTitle>{t("Item Groups")} </PageTitle>
      <MainDrawer>
        <ItemGroupDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={handleSubmitUser}
              className="py-2 flex flex-col md:flex-row flex-wrap md:flex-nowrap items-stretch md:items-center justify-between gap-3 md:gap-4"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[220px] max-w-lg lg:max-w-xl">
                <Input
                  ref={userRef}
                  type="search"
                  name="search"
                  placeholder={t("Search Item Group")}
                  onChange={onSearchChange}
                  className="page-search-input flex-1"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all flex-shrink-0"
                >
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0 md:ml-auto">
                <Button
                  onClick={toggleDrawer}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center transition-all"
                >
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  {t("Add Item Group")}
                </Button>

                <Button
                  disabled={syncLoading}
                  onClick={syncItemGroup}
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
        // <Loading loading={loading} />
        <TableLoading row={12} col={7} width={163} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : itemGroups?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-b-lg">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Image")}</TableCell>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("Alias")}</TableCell>
                <TableCell>{t("MOQ")}</TableCell>
                <TableCell>{t("Discount")}</TableCell>
                <TableCell>{t("Under Group")}</TableCell>
                <TableCell className="text-center">{t("Store Show")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-right">{t("Actions")}</TableCell>
              </tr>
            </TableHeader>
            <ItemGroupTable dataTable={itemGroups} lang={lang} />
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
            <div className="w-full flex items-center justify-between px-4 py-2">
              <div className="text-sm">
                {totalResults > 0 ? (
                  <span>
                    Showing {Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)}-
                    {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                  </span>
                ) : (
                  <span>Showing 0 of 0</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button layout="outline" onClick={handlePrevPage} disabled={currentPage <= 1}>
                  Prev
                </Button>
                {startPage > 1 && (
                  <>
                    <Button
                      layout="outline"
                      onClick={() => handleChangePage(1)}
                      className={currentPage === 1 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium" : ""}
                    >
                      1
                    </Button>
                    {startPage > 2 && <span className="px-1">...</span>}
                  </>
                )}
                {Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, idx) => {
                  const p = startPage + idx;
                  if (p === 1 || p === totalPages) return null;
                  return (
                    <Button
                      key={`p-${p}`}
                      layout="outline"
                      onClick={() => handleChangePage(p)}
                      className={currentPage === p ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium" : ""}
                    >
                      {p}
                    </Button>
                  );
                })}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="px-1">...</span>}
                    <Button
                      layout="outline"
                      onClick={() => handleChangePage(totalPages)}
                      className={currentPage === totalPages ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 font-medium" : ""}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button layout="outline" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </TableFooter>
        </TableContainer>
      ) : (
        <NotFound title="Item Group" />
      )}
    </>
  );
};

export default ItemGroup;
