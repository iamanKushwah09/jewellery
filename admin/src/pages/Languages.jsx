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
import { FiPlus } from "react-icons/fi";
import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit, FiTrash2 } from "react-icons/fi";
//internal import
import BulkActionDrawer from "@/components/drawer/BulkActionDrawer";
import CheckBox from "@/components/form/others/CheckBox";
import LanguageTable from "@/components/language/LanguageTable";
import DeleteModal from "@/components/modal/DeleteModal";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import LanguageServices from "@/services/LanguageServices";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import LanguageDrawer from "@/components/drawer/LanguageDrawer";
import MainDrawer from "@/components/drawer/MainDrawer";
import AnimatedContent from "@/components/common/AnimatedContent";

const Languages = () => {
  const { toggleDrawer } = useContext(SidebarContext);

  const { allId, handleUpdateMany, handleDeleteMany } = useToggleDrawer();
  const { data, loading, error } = useAsync(LanguageServices.getAllLanguages);
  // console.log("data-language", data);
  const {
    totalResults,
    resultsPerPage,
    dataTable,
    languageRef,
    handleSubmitLanguage,
    handleChangePage,
  } = useFilter(data);

  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(data?.map((li) => li._id));
    if (isCheckAll) {
      setIsCheck([]);
    }
  };

  const { t } = useTranslation();

  return (
    <>
      <PageTitle>Languages</PageTitle>
      <MainDrawer>
        <LanguageDrawer />
      </MainDrawer>

      <BulkActionDrawer ids={allId} title="Languages" />

      <DeleteModal
        ids={allId}
        setIsCheck={setIsCheck}
        title="Selected Currencies"
      />

      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <form
              onSubmit={handleSubmitLanguage}
              className="py-3 flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch md:items-center gap-3 md:gap-4"
            >
              <div className="flex-1 min-w-[200px] max-w-sm sm:max-w-md w-full">
                <Input
                  ref={languageRef}
                  type="search"
                  placeholder={t("SearchLanguage")}
                  className="page-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  disabled={isCheck.length < 1}
                  onClick={() => handleUpdateMany(isCheck)}
                  className="h-10 px-3.5 rounded-lg btn-action-reset flex items-center text-xs sm:text-sm font-medium"
                >
                  <span className="mr-2">
                    <FiEdit />
                  </span>
                  {t("BulkAction")}
                </Button>

                <Button
                  disabled={isCheck.length < 1}
                  onClick={() => handleDeleteMany(isCheck)}
                  className="h-10 px-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium shadow-sm flex items-center"
                >
                  <span className="mr-2">
                    <FiTrash2 />
                  </span>
                  {t("Delete")}
                </Button>

                <Button
                  onClick={toggleDrawer}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium shadow-button flex items-center"
                >
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  Add language
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
                      handleClick={handleSelectAll}
                      isChecked={isCheckAll}
                    />
                  </TableCell>
                  <TableCell>{t("LanguagesSr")}</TableCell>
                  <TableCell>{t("LanguagesNname")}</TableCell>
                  <TableCell>{t("LanguagesIsoCode")}</TableCell>
                  <TableCell>{t("LanguagesFlag")}</TableCell>
                  <TableCell className="text-center">
                    {t("LanguagesPublished")}
                  </TableCell>
                  <TableCell className="text-right">
                    {t("LanguagesActions")}
                  </TableCell>
                </tr>
              </TableHeader>
              <LanguageTable
                languages={dataTable}
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
        <NotFound title="Sorry, There are no languages right now." />
      )}
    </>
  );
};

export default Languages;
