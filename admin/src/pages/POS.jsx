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
//internal import
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import MainDrawer from "@/components/drawer/MainDrawer";
import POSDrawer from "@/components/drawer/POSDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import StaffTable from "@/components/staff/StaffTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AdminServices from "@/services/AdminServices";
import AnimatedContent from "@/components/common/AnimatedContent";

const POS = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);
  const { data, loading, error } = useAsync(() =>
    AdminServices.getAllStaff({ email: adminInfo.email })
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
      <PageTitle>{t("POS")} </PageTitle>
      <MainDrawer product={true}>
        <POSDrawer />
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
                  placeholder={t("StaffSearchBy")}
                  className="page-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all"
                >
                  Filter
                </Button>

                <Button
                  onClick={toggleDrawer}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center transition-all"
                >
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  {t("Add POS")}
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
                <TableCell>{t("StaffNameTbl")}</TableCell>
                <TableCell>{t("StaffEmailTbl")}</TableCell>
                <TableCell>{t("StaffContactTbl")}</TableCell>
                <TableCell>{t("StaffJoiningDateTbl")}</TableCell>
                <TableCell>{t("StaffRoleTbl")}</TableCell>
                <TableCell className="text-center">{t("Active")}</TableCell>
                <TableCell className="text-center">
                  {t("OderStatusTbl")}
                </TableCell>
                <TableCell className="text-center">
                  {t("PublishedTbl")}
                </TableCell>

                <TableCell className="text-right">
                  {t("StaffActionsTbl")}
                </TableCell>
              </tr>
            </TableHeader>
            {/* <StaffTable staffs={dataTable} lang={lang} /> */}
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
        // <TableContainer className="mb-8 rounded-b-lg">
        //   <Table>
        //     <TableHeader>
        //       <tr>
        //         <TableCell>{t("StaffNameTbl")}</TableCell>
        //         <TableCell>{t("StaffEmailTbl")}</TableCell>
        //         <TableCell>{t("StaffContactTbl")}</TableCell>
        //         <TableCell>{t("StaffJoiningDateTbl")}</TableCell>
        //         <TableCell>{t("StaffRoleTbl")}</TableCell>
        //           <TableCell className="text-center">{t("Active")}</TableCell>

        //         <TableCell className="text-center">
        //           {t("PublishedTbl")}
        //         </TableCell>

        //         <TableCell className="text-right">
        //           {t("StaffActionsTbl")}
        //         </TableCell>
        //       </tr>
        //     </TableHeader>
        //     <StaffTable staffs={dataTable} lang={lang} />
        //   </Table>
        //   <TableFooter>
        //     <Pagination
        //       totalResults={totalResults}
        //       resultsPerPage={resultsPerPage}
        //       onChange={handleChangePage}
        //       label="Table navigation"
        //     />
        //   </TableFooter>
        // </TableContainer>
      ) : (
        <NotFound title="POS Order" />
      )}
    </>
  );
};

export default POS;
