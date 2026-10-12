import { Button, Input } from "@windmill/react-ui";
import exportFromJSON from "export-from-json";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkCode, BsFileEarmarkMedical } from "react-icons/bs";
import {
  FiDownload,
  FiPlus,
  FiUpload,
  FiUploadCloud,
  FiXCircle,
} from "react-icons/fi";
// import { ImFileExcel } from "react-icons/im";
import { useLocation } from "react-router-dom";

//internal import
import spinnerLoadingImage from "@/assets/img/spinner.gif";
import { SidebarContext } from "@/context/SidebarContext";
import ProductServices from "@/services/ProductServices";

const UploadMany = ({
  title,
  totalDoc,
  filename,
  exportData,
  isDisabled,
  handleSelectFile,
  handleRemoveSelectFile,
  handleUploadMultiple,
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  const dRef = useRef();
  const [dropDown, setDropDown] = useState(false);
  const [isImportBoxShown, setIsImportBoxShown] = useState(false);
  const { loading } = useContext(SidebarContext);
  const [loadingExport, setLoadingExport] = useState({
    name: "",
    status: false,
  });

  // console.log(exportData);

  const handleExportCSV = () => {
    if (location.pathname === "/products") {
      setLoadingExport({ name: "csv", status: true });
      ProductServices.getAllProducts({
        page: 1,
        limit: totalDoc,
        category: null,
        title: null,
        price: 0,
      })
        .then((res) => {
          setDropDown(false);
          setLoadingExport({ name: "", status: false });
          exportFromJSON({
            data: res.products,
            fileName: "products",
            exportType: exportFromJSON.types.csv,
          });
        })
        .catch((err) => {
          setLoadingExport({ name: "", status: false });
          setDropDown(false);
          // console.log(err);
        });
    }
    if (location.pathname === "/categories") {
      exportFromJSON({
        data: exportData,
        fileName: "categories",
        exportType: exportFromJSON.types.csv,
      });
    }
    if (location.pathname === "/attributes") {
      exportFromJSON({
        data: exportData,
        fileName: "attributes",
        exportType: exportFromJSON.types.csv,
      });
    }

    if (location.pathname === "/coupons") {
      exportFromJSON({
        data: exportData,
        fileName: "coupons",
        exportType: exportFromJSON.types.csv,
      });
    }
    if (location.pathname === "/customers") {
      exportFromJSON({
        data: exportData,
        fileName: "customers",
        exportType: exportFromJSON.types.csv,
      });
    }
  };

  const handleExportJSON = () => {
    if (location.pathname === "/products") {
      setLoadingExport({ name: "json", status: true });
      ProductServices.getAllProducts({
        page: 1,
        limit: totalDoc,
        category: null,
        title: null,
        price: 0,
      })
        .then((res) => {
          setDropDown(false);
          setLoadingExport({ name: "json", status: true });
          exportFromJSON({
            data: res.products,
            fileName: "products",
            exportType: exportFromJSON.types.json,
          });
        })
        .catch((err) => {
          setDropDown(false);
          setLoadingExport({ name: "json", status: true });
          // console.log(err);
        });
    }
    if (location.pathname === "/categories") {
      exportFromJSON({
        data: exportData,
        fileName: "categories",
        exportType: exportFromJSON.types.json,
      });
    }
    if (location.pathname === "/attributes") {
      exportFromJSON({
        data: exportData,
        fileName: "attributes",
        exportType: exportFromJSON.types.json,
      });
    }

    if (location.pathname === "/coupons") {
      exportFromJSON({
        data: exportData,
        fileName: "coupons",
        exportType: exportFromJSON.types.json,
      });
    }
    if (location.pathname === "/customers") {
      exportFromJSON({
        data: exportData,
        fileName: "customers",
        exportType: exportFromJSON.types.json,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dRef?.current?.contains(e.target)) {
        setDropDown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
  }, [dRef]);

  return (
    <div className=" lg:flex md:flex flex-grow-0">
      <div className="flex">
        <div ref={dRef} className="lg:flex-1 md:flex-1 mr-3 sm:flex-none">
          {(title === "Products" ||
            title === "Attribute" ||
            title === "Extra" ||
            title === "Coupon" ||
            title === "Customers" ||
            title === "Categories") &&
            (loadingExport.status ? (
              <Button className="h-10 px-4 rounded-lg">
                <img
                  src={spinnerLoadingImage}
                  alt="Loading"
                  width={16}
                  height={16}
                  className="animate-spin mr-2"
                />
                <span className="text-xs font-medium">Exporting</span>
              </Button>
            ) : (
              <button
                onClick={() => setDropDown(!dropDown)}
                className="border border-stroke flex justify-center items-center h-10 px-4 text-xs font-medium text-black bg-white hover:border-primary hover:text-primary rounded-lg transition-all shadow-sm focus:outline-none"
              >
                <FiUpload className="mr-2 text-primary" />
                <span>{t("Export")}</span>
              </button>
            ))}
          {dropDown && (
            <ul className="origin-top-left absolute w-52 mt-1 rounded-xl shadow-dropdown border border-stroke bg-white z-50 overflow-hidden py-1 divide-y divide-stroke">
              <li className="font-medium transition-colors hover:bg-gray-50 text-black hover:text-primary">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 focus:outline-none"
                >
                  <span className="flex items-center text-xs font-medium">
                    <BsFileEarmarkMedical
                      className="w-4 h-4 mr-2.5 text-primary"
                      aria-hidden="true"
                    />

                    <span>
                      Export to CSV
                      {loadingExport.name === "csv" &&
                        loadingExport.status &&
                        "...."}
                    </span>
                  </span>
                </button>
              </li>

              <li className="font-medium transition-colors hover:bg-gray-50 text-black hover:text-primary">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 focus:outline-none"
                  onClick={handleExportJSON}
                >
                  <span className="flex items-center text-xs font-medium">
                    <BsFileEarmarkCode
                      className="w-4 h-4 mr-2.5 text-primary"
                      aria-hidden="true"
                    />
                    <span>
                      Export to JSON
                      {loadingExport.name === "json" &&
                        loadingExport.status &&
                        "...."}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          )}
        </div>

        <div className="lg:flex-1 md:flex-1 mr-3 sm:flex-none">
          <button
            onClick={() => setIsImportBoxShown(!isImportBoxShown)}
            className="border border-stroke flex justify-center items-center h-10 px-4 text-xs font-medium text-black bg-white hover:border-primary hover:text-primary rounded-lg transition-all shadow-sm focus:outline-none"
          >
            <FiDownload className="mr-2 text-primary" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {isImportBoxShown && (
        <>
          <div className="w-full my-2 lg:my-0 md:my-0 flex items-center">
            <div className="h-10 border border-dashed border-primary/40 bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors rounded-lg px-3 flex items-center">
              <label className="w-full h-full flex justify-center items-center text-xs text-body leading-none cursor-pointer">
                <Input
                  disabled={isDisabled}
                  type="file"
                  accept=".csv,.xls,.json"
                  onChange={handleSelectFile}
                />
                {filename ? (
                  <span className="font-semibold text-black max-w-[160px] truncate">{filename}</span>
                ) : (
                  <>
                    <FiUploadCloud className="mx-2 text-primary text-base" />{" "}
                    <span>{t("SelectYourJSON")} {title} {t("File")}</span>
                  </>
                )}
                {filename && (
                  <span
                    onClick={handleRemoveSelectFile}
                    type="button"
                    className="text-danger hover:text-red-700 focus:outline-none ml-2 text-base"
                  >
                    <FiXCircle />
                  </span>
                )}
              </label>
            </div>

            <div className="flex">
              {loading ? (
                <Button className="ml-2 h-10 px-4 rounded-lg">
                  <img
                    src={spinnerLoadingImage}
                    alt="Loading"
                    width={16}
                    height={16}
                    className="animate-spin mr-2"
                  />
                  <span className="text-xs font-medium">Processing</span>
                </Button>
              ) : (
                <Button
                  onClick={handleUploadMultiple}
                  className="h-10 ml-2 px-4 rounded-lg text-xs font-medium shadow-button"
                >
                  <FiPlus className="mr-1.5" />
                  <span>{t("ImportNow")}</span>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default UploadMany;
