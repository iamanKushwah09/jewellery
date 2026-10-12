import {
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Pagination,
  Select,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import { useContext, useState } from "react";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import exportFromJSON from "export-from-json";
import { FiPlus } from "react-icons/fi";

//internal import
import { notifyError } from "@/utils/toast";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import OrderServices from "@/services/OrderServices";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import OrderTable from "@/components/order/OrderTable";
import TableLoading from "@/components/preloader/TableLoading";
import spinnerLoadingImage from "@/assets/img/spinner.gif";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import AnimatedContent from "@/components/common/AnimatedContent";
import OrderDrawer from "@/components/drawer/OrderDrawer";
import MainDrawer from "@/components/drawer/MainDrawer";

const Orders = () => {
  const {
    time,
    setTime,
    status,
    endDate,
    setStatus,
    setEndDate,
    startDate,
    currentPage,
    searchText,
    searchRef,
    method,
    setMethod,
    setStartDate,
    setSearchText,
    handleChangePage,
    handleSubmitForAll,
    resultsPerPage,
    toggleDrawer,
  } = useContext(SidebarContext);

  const { t } = useTranslation();

  const [loadingExport, setLoadingExport] = useState(false);

  //API CALLING GET ALL RECORDS
  const { data, loading, error } = useAsync(() => OrderServices.getAllOrder({}));
  const { currency, getNumber, getNumberTwo } = useUtilsFunction();
  const { dataTable, serviceData } = useFilter(data);

  const handleDownloadOrders = async () => {
    try {
      setLoadingExport(true);
      const res = await OrderServices.getAllOrder({
        page: 1,
        day: time,
        method: method,
        status: status,
        endDate: endDate,
        download: true,
        startDate: startDate,
        limit: data?.totalDoc,
        customerName: searchText,
      });

      // console.log("handleDownloadOrders", res);
      const exportData = res?.orders?.map((order) => {
        return {
          _id: order._id,
          invoice: order.invoice,
          subTotal: getNumberTwo(order.subTotal),
          shippingCost: getNumberTwo(order.shippingCost),
          discount: getNumberTwo(order?.discount),
          total: getNumberTwo(order.total),
          paymentMethod: order.paymentMethod,
          status: order.status,
          user_info: order?.user_info?.name,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      });
      // console.log("exportData", exportData);

      exportFromJSON({
        data: exportData,
        fileName: "orders",
        exportType: exportFromJSON.types.csv,
      });
      setLoadingExport(false);
    } catch (err) {
      setLoadingExport(false);
      // console.log("err on orders download", err);
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // handle reset field
  const handleResetField = () => {
    setTime("");
    setMethod("");
    setStatus("");
    setEndDate("");
    setStartDate("");
    setSearchText("");
    searchRef.current.value = "";
  };
  // console.log("data in orders page", data);

  return (
    <>
      <PageTitle>{t("Customer Orders")}</PageTitle>
      <MainDrawer product={false}>
        <OrderDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={handleSubmitForAll}
              className="py-3 flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch md:items-center gap-3 md:gap-4"
            >
              <div className="flex-1 min-w-[200px] max-w-sm sm:max-w-md w-full">
                <Input
                  // ref={userRef}
                  type="search"
                  name="search"
                  placeholder={t("Search Order")}
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
                  {t("Add Order")}
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
      {data?.methodTotals?.length > 0 && (
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 rounded-t-lg rounded-0 mb-4">
          <CardBody>
            <div className="flex gap-1">
              {data?.methodTotals?.map((el, i) => (
                <div key={i + 1} className="dark:text-gray-300">
                  {el?.method && (
                    <>
                      <span className="font-medium"> {el.method}</span> :{" "}
                      <span className="font-semibold mr-2">
                        {currency}
                        {getNumber(el.total)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <TableLoading row={12} col={7} width={160} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : serviceData?.length !== 0 ? (
        <TableContainer className="mb-8 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>{t("Order no")}</TableCell>
                <TableCell>{t("Order date")}</TableCell>
                <TableCell>{t("Payment mode")}</TableCell>
                <TableCell>{t("Shipping charge")}</TableCell>
                <TableCell>{t("Total Amt.")}</TableCell>
                <TableCell>{t("Total Qty.")}</TableCell>
                <TableCell>{t("ActionTbl")}</TableCell>
                {/* <TableCell className="text-right">{t("InvoiceTbl")}</TableCell> */}
              </tr>
            </TableHeader>

            <OrderTable orders={dataTable} />
          </Table>

          <TableFooter>
            <Pagination
              totalResults={data?.length}
              resultsPerPage={resultsPerPage}
              onChange={handleChangePage}
              label="Table navigation"
            />
          </TableFooter>
        </TableContainer>
      ) : (
        <NotFound title="No orders found" />
      )}
    </>
  );
};

export default Orders;
