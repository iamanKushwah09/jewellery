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
import ShippingDrawer from "@/components/drawer/ShippingDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import ShippingTable from "@/components/shipping/shippingTable";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import ShippingServices from "@/services/ShippingServices";
import AnimatedContent from "@/components/common/AnimatedContent";

const Shipping = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer, lang } = useContext(SidebarContext);

  const { data, loading, error } = useAsync(() =>
    ShippingServices.getAllShipping({ email: adminInfo.email })
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
      <PageTitle>{t("Shipping")} </PageTitle>
      <MainDrawer>
        <ShippingDrawer />
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
                  placeholder={t("Search Shipping")}
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
                  {t("Add Shipping")}
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
                <TableCell>{t("Bill Amount")}</TableCell>
                <TableCell>{t("Shipping charge")}</TableCell>
                <TableCell className="text-right">{t("Actions")}</TableCell>
              </tr>
            </TableHeader>
            <ShippingTable dataTable={dataTable} lang={lang} />
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
        <NotFound title="Shipping" />
      )}
    </>
  );
};

export default Shipping;
