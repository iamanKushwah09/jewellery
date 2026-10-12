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

import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import MainDrawer from "@/components/drawer/MainDrawer";
import RoleDrawer from "@/components/drawer/RoleDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import RoleTable from "@/components/role/roleTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import RoleServices from "@/services/RoleServices";
import AnimatedContent from "@/components/common/AnimatedContent";

const Role = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);

  const { data, loading, error } = useAsync(() =>
    RoleServices.getAllRole({ email: adminInfo.email })
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

  return (
    <>
      <PageTitle>{t("RolePageTitle")} </PageTitle>
      <MainDrawer>
        <RoleDrawer />
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
                  placeholder={t("Search Role")}
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
                  {t("Add Role")}
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
                <TableCell>{t("Role Name")}</TableCell>
                <TableCell>{t("Description")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-right">{t("Actions")}</TableCell>
              </tr>
            </TableHeader>
            <RoleTable roles={dataTable} lang={lang} />
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
        <NotFound title="Sorry, There are no role right now." />
      )}
    </>
  );
};

export default Role;
