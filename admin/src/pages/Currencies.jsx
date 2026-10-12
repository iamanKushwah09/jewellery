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
import { t } from "i18next";
import React, { useState, useContext } from "react";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

//internal import
import BulkActionDrawer from "@/components/drawer/BulkActionDrawer";
import CurrencyDrawer from "@/components/drawer/CurrencyDrawer";
import MainDrawer from "@/components/drawer/MainDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import CurrencyServices from "@/services/CurrencyServices";
import TableLoading from "@/components/preloader/TableLoading";
import CheckBox from "@/components/form/others/CheckBox";
import CurrencyTable from "@/components/currency/CurrencyTable";
import NotFound from "@/components/table/NotFound";
import AnimatedContent from "@/components/common/AnimatedContent";

const Currencies = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const { allId, handleUpdateMany, handleDeleteMany } = useToggleDrawer();
  const { data, loading, error } = useAsync(CurrencyServices.getAllCurrency);

  const {
    totalResults,
    resultsPerPage,
    dataTable,
    handleChangePage,
    handleSubmitCurrency,
    currencyRef,
  } = useFilter(data);

  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(data.map((li) => li._id));
    if (isCheckAll) {
      setIsCheck([]);
    }
  };

  return (
    <>
      <PageTitle>Currencies</PageTitle>
      <BulkActionDrawer ids={allId} title="Currencies" />
      <MainDrawer>
        <CurrencyDrawer />
      </MainDrawer>
      <DeleteModal
        ids={allId}
        setIsCheck={setIsCheck}
        title="Selected Currencies"
      />

      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={handleSubmitCurrency}
              className="py-2 flex flex-col md:flex-row flex-wrap md:flex-nowrap items-stretch md:items-center justify-between gap-3 md:gap-4"
            >
              <div className="flex-1 min-w-[220px] max-w-lg lg:max-w-xl w-full">
                <Input
                  ref={currencyRef}
                  type="search"
                  placeholder={t("SearchIsoCode")}
                  className="page-search-input"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0 md:ml-auto">
                <Button
                  disabled={isCheck.length < 1}
                  onClick={() => handleUpdateMany(isCheck)}
                  className="h-10 px-3.5 rounded-lg btn-action-reset flex items-center text-xs sm:text-sm font-medium"
                >
                  <span className="mr-2">
                    <FiEdit />
                  </span>
                  Bulk Action
                </Button>

                <Button
                  disabled={isCheck.length < 1}
                  onClick={() => handleDeleteMany(isCheck)}
                  className="h-10 px-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium shadow-sm flex items-center"
                >
                  <span className="mr-2">
                    <FiTrash2 />
                  </span>
                  Delete
                </Button>

                <Button
                  onClick={toggleDrawer}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center"
                >
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  Add Currency
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
      ) : (
        data.length !== 0 && (
          <TableContainer className="mb-8 rounded-b-lg">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>
                    <CheckBox
                      type="checkbox"
                      name="selectAll"
                      id="selectAll"
                      isChecked={isCheckAll}
                      handleClick={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {t("CurrenciesName")}
                  </TableCell>
                  {/* <TableCell className="text-center">{t("Currencyisocode")}</TableCell> */}
                  <TableCell className="text-center">
                    {t("CurrenciesSymbol")}
                  </TableCell>

                  <TableCell className="text-center">
                    {t("CurrenciesEnabled")}
                  </TableCell>

                  <TableCell className="text-right">
                    {t("CurrenciesActions")}
                  </TableCell>
                </tr>
              </TableHeader>

              <CurrencyTable
                currency={dataTable}
                isCheck={isCheck}
                setIsCheck={setIsCheck}
              />
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
        )
      )}
      {!loading && data.length === 0 && !error && (
        <NotFound title="Sorry, There are no currency right now." />
      )}
    </>
  );
};

export default Currencies;
