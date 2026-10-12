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
import { useContext, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiFilter, FiX, FiFileText } from "react-icons/fi";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import MainDrawer from "@/components/drawer/MainDrawer";
import SaleDrawer from "@/components/drawer/SaleDrawer";
import ConvertSaleOrderModal from "@/components/modal/ConvertSaleOrderModal";
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
  const { toggleDrawer, setIsUpdate } = useContext(SidebarContext);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

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

  const saleRef = useRef(null);

  const {
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
          <CardBody className="p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSale(e);
              }}
              className="space-y-3 sm:space-y-4"
            >
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <div className="flex-1 w-full min-w-0">
                  <Input
                    ref={saleRef}
                    type="search"
                    name="search"
                    placeholder="Search by Voucher, Customer, Mobile, Salesman..."
                    className="page-search-input w-full"
                  />
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
                  <Button
                    type="submit"
                    className="h-9 sm:h-10 px-2 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs sm:text-sm font-medium transition-all flex items-center justify-center"
                  >
                    Search
                  </Button>
                  <Button
                    onClick={toggleDrawer}
                    className="h-9 sm:h-10 px-2 sm:px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center justify-center transition-all whitespace-nowrap"
                  >
                    <span className="mr-1 sm:mr-2">
                      <FiPlus />
                    </span>
                    <span className="truncate">Add Sale</span>
                  </Button>
                  <Button
                    onClick={handleResetField}
                    type="reset"
                    className="btn-action-reset h-9 sm:h-10 px-2 sm:px-4 flex items-center justify-center text-xs sm:text-sm"
                  >
                    <span>Reset</span>
                  </Button>
                </div>
              </div>

              {/* Compact Date Filter Row */}
              <div className="pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                    <FiFilter className="w-3.5 h-3.5 text-primary" />
                    <span>Date Range:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center flex-1 sm:flex sm:items-center min-w-0">
                    <Input
                      type="date"
                      value={dateFilters.startDate}
                      onChange={(e) => setDateFilters(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      className="w-full flex-1 h-9 sm:h-10 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm min-w-0"
                      title="Start Date"
                    />
                    <span className="hidden sm:inline text-xs text-gray-400 font-medium flex-shrink-0">to</span>
                    <Input
                      type="date"
                      value={dateFilters.endDate}
                      onChange={(e) => setDateFilters(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      className="w-full flex-1 h-9 sm:h-10 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm min-w-0"
                      title="End Date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                  <Button
                    onClick={handleDateFilter}
                    disabled={isFiltering || (!dateFilters.startDate && !dateFilters.endDate)}
                    className="h-9 sm:h-10 px-3 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium transition-all flex items-center justify-center w-full sm:w-auto"
                  >
                    <FiFilter className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{isFiltering ? 'Filtering...' : 'Apply Date Filter'}</span>
                  </Button>

                  <Button
                    onClick={clearDateFilters}
                    layout="outline"
                    className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-danger hover:text-danger text-xs sm:text-sm font-medium transition-all flex items-center justify-center w-full sm:w-auto"
                    disabled={isFiltering}
                  >
                    <FiX className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">Clear Dates</span>
                  </Button>
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
