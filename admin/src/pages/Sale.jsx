import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiFilter, FiX } from "react-icons/fi";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import MainDrawer from "@/components/drawer/MainDrawer";
import SaleDrawer from "@/components/drawer/SaleDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import AnimatedContent from "@/components/common/AnimatedContent";
import SaleServices from "@/services/SaleServices";
import SaleTable from "@/components/sale/SaleTable";

const Sale = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { toggleDrawer } = useContext(SidebarContext);

  // Date range filter state
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredData, setFilteredData] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);

  const {
    data: dataTable,
    loading,
    error,
  } = useAsync(() => SaleServices.getAllSale());

  const {
    saleOrderRef: saleRef,
    setSaleOrderData: setSaleData,
    totalResults,
    resultsPerPage,
    saleOrderData: saleData,
    handleChangePage,
    handleSubmitSaleOrder: handleSubmitSale,
    setSearchSaleOrder: setSearchSale,
  } = useFilter(dataTable);

  const { t } = useTranslation();

  // Date filter submission handler
  const handleDateFilter = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsFiltering(true);
      const queryParams = {};
      if (dateFilters.startDate) queryParams.startDate = dateFilters.startDate;
      if (dateFilters.endDate) queryParams.endDate = dateFilters.endDate;

      const response = await SaleServices.getSalesByFilter(queryParams);
      if (response.success) {
        setFilteredData(response.data.orders);
      } else {
        throw new Error(response.message || 'Failed to filter by date range');
      }
    } catch (error) {
      console.error('Date filtering error:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const clearDateFilters = () => {
    setDateFilters({
      startDate: '',
      endDate: ''
    });
    setFilteredData(null);
  };

  const handleResetField = () => {
    setSaleData([]);
    if (saleRef.current) saleRef.current.value = "";
    setSearchSale("");
    clearDateFilters();
    setFilteredData(null);
  };

  return (
    <>
      <PageTitle>Sale / Transactions</PageTitle>
      <MainDrawer product={true}>
        <SaleDrawer />
      </MainDrawer>
      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSale(e);
              }}
              className="space-y-4"
            >
              {/* Search Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Input
                    ref={saleRef}
                    type="search"
                    name="search"
                    placeholder="Search by Voucher, Customer, Mobile, Salesman..."
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-1">
                  <Button
                    type="submit"
                    className="h-12 w-full bg-blue-700 hover:bg-blue-800"
                  >
                    Search
                  </Button>
                </div>
                <div className="md:col-span-1">
                  <Button
                    onClick={toggleDrawer}
                    className="w-full rounded-md h-12 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <span className="mr-3">
                      <FiPlus />
                    </span>
                    Add Sale
                  </Button>
                </div>
                <div className="md:col-span-1">
                  <Button
                    layout="outline"
                    onClick={handleResetField}
                    type="reset"
                    className="px-4 md:py-1 py-3 text-sm dark:bg-gray-700 w-full h-12"
                  >
                    <span className="text-black dark:text-gray-200">Reset</span>
                  </Button>
                </div>
              </div>

              {/* Date Filter Row */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center mb-3">
                  <FiFilter className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date Range Filter
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={dateFilters.startDate}
                      onChange={(e) => setDateFilters(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={dateFilters.endDate}
                      onChange={(e) => setDateFilters(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      onClick={handleDateFilter}
                      className="w-full h-10"
                      disabled={isFiltering}
                    >
                      {isFiltering ? 'Filtering...' : 'Apply Date Filter'}
                    </Button>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      layout="outline"
                      onClick={clearDateFilters}
                      className="w-full h-10"
                      disabled={isFiltering}
                    >
                      <FiX className="w-4 h-4 mr-2" />
                      Clear Dates
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </AnimatedContent>

      {loading ? (
        <TableLoading row={12} col={7} width={163} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : (
        <>
          {(filteredData || saleData)?.length !== 0 ? (
            <TableContainer className="mb-8 rounded-b-lg">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>Voucher No</TableCell>
                    <TableCell>Group Type</TableCell>
                    <TableCell>Net Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Sale Type</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell>Salesman</TableCell>
                    <TableCell className="text-center">Status</TableCell>
                    <TableCell className="text-right">Action</TableCell>
                  </tr>
                </TableHeader>
                <SaleTable dataTable={filteredData || saleData} />
              </Table>
              <TableFooter>
                <Pagination
                  totalResults={filteredData ? filteredData.length : totalResults}
                  resultsPerPage={resultsPerPage}
                  onChange={handleChangePage}
                  label="Table navigation"
                />
              </TableFooter>
            </TableContainer>
          ) : (
            <NotFound
              title={
                filteredData
                  ? 'No sales found for the selected date range'
                  : 'There are no sales right now. Click "Add Sale" to create your first transaction.'
              }
            />
          )}
        </>
      )}
    </>
  );
};

export default Sale;
