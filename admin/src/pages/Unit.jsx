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
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus } from "react-icons/fi";
import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import MainDrawer from "@/components/drawer/MainDrawer";
import UnitDrawer from "@/components/drawer/UnitDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import UnitTable from "@/components/unit/unitTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
// import AdminServices from "@/services/AdminServices";
import AnimatedContent from "@/components/common/AnimatedContent";
import UnitServices from "@/services/UnitServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const Unit = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);
  const [syncLoading, setSyncLoading] = useState(false);

  const { data, loading, error } = useAsync(() =>
    UnitServices.getAllUnit({ email: adminInfo.email })
  );

  const {
    userRef,
    setRole,
    totalResults,
    resultsPerPage,
    dataTable,
    serviceData,
    handleChangePage,
    handleSubmitUser,
  } = useFilter(data);

  const { t } = useTranslation();

  // handle reset filed
  const handleResetField = () => {
    setRole("");
    userRef.current.value = "";
  };

  const syncUnit = async () => {
    setSyncLoading(true);
    try {
      const res = await UnitServices.syncUnit();
      notifySuccess(res.message);
    } catch (err) {
      notifyError(`Error syncing units: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <>
      <PageTitle>{t("Unit")} </PageTitle>
      <MainDrawer>
        <UnitDrawer />
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
                  placeholder={t("Search Unit")}
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
                  {t("Add Unit")}
                </Button>

                <Button
                  disabled={syncLoading}
                  onClick={syncUnit}
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
      ) : serviceData?.length !== 0 ? (
        <TableContainer className="mb-8 rounded-b-lg">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Name")}</TableCell>
                {/* <TableCell>{t("Discount")}</TableCell> */}
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-right">{t("Actions")}</TableCell>
              </tr>
            </TableHeader>
            <UnitTable dataTable={dataTable} lang={lang} />
          </Table>
          <TableFooter>
            <Pagination
              totalResults={totalResults}
              resultsPerPage={resultsPerPage}
              onChange={handleChangePage}
              label="Table navigation"
            />
          </TableFooter>
        </TableContainer>
      ) : (
        <NotFound title="Unit" />
      )}
    </>
  );
};

export default Unit;
