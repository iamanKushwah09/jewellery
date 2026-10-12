import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2, FiZoomIn, FiPrinter } from "react-icons/fi";
import Tooltip from "@/components/tooltip/Tooltip";
import { GrView } from "react-icons/gr";
import { FiPlay } from "react-icons/fi";

const EditDeleteButton = ({
  id,
  title,
  handleUpdate,
  handleModalOpen,
  isCheck,
  product,
  parent,
  children,
  flag = false,
  isShow = false,
  handleProcess,
  handlePrint,
  busyApiStatus
}) => {
  const { t } = useTranslation();

  // Disable all buttons if busyApiStatus is 'SUCCESS'
  const isDisabled = busyApiStatus === 'SUCCESS' || isCheck?.length > 0;

  return (
    <>
      <div className="flex items-center justify-end text-right gap-1.5">
        {children?.length > 0 ? (
          <>
            <Link
              to={`/categories/${parent?._id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#845adf]/10 text-[#845adf] hover:bg-[#845adf] hover:text-white transition-all duration-200 focus:outline-none shadow-xs"
            >
              <Tooltip
                id="view"
                Icon={FiZoomIn}
                title={t("View")}
                bgColor="#845adf"
              />
            </Link>

            <button
              disabled={isDisabled}
              onClick={() => handleUpdate(id)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#845adf]/10 text-[#845adf] hover:bg-[#845adf] hover:text-white transition-all duration-200 focus:outline-none shadow-xs ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Tooltip
                id="edit"
                Icon={FiEdit}
                title={t("Edit")}
                bgColor="#845adf"
              />
            </button>
          </>
        ) : (
          <button
            disabled={isDisabled}
            onClick={() => handleUpdate(id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#845adf]/10 text-[#845adf] hover:bg-[#845adf] hover:text-white transition-all duration-200 focus:outline-none shadow-xs ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Tooltip
              id="edit"
              Icon={isShow ? GrView : FiEdit}
              title={isShow ? t("View") : t("Edit")}
              bgColor="#845adf"
            />
          </button>
        )}

        {handleProcess && (
          <button
            disabled={isDisabled}
            onClick={() => handleProcess(id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#23b7e5]/10 text-[#23b7e5] hover:bg-[#23b7e5] hover:text-white transition-all duration-200 focus:outline-none shadow-xs ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Busy Posting"
          >
            <Tooltip
              id="process"
              Icon={FiPlay}
              title="Busy Posting"
              bgColor="#23b7e5"
            />
          </button>
        )}

        {handlePrint && (
          <button
            onClick={() => handlePrint(id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#23b7e5]/10 text-[#23b7e5] hover:bg-[#23b7e5] hover:text-white transition-all duration-200 focus:outline-none shadow-xs ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Print Invoice"
            type="button"
          >
            <Tooltip
              id="print"
              Icon={FiPrinter}
              title="Print Invoice"
              bgColor="#23b7e5"
            />
          </button>
        )}

        {!isShow && !flag ? (
          <button
            disabled={isDisabled}
            onClick={() => handleModalOpen(id, title, product)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6533c]/10 text-[#e6533c] hover:bg-[#e6533c] hover:text-white transition-all duration-200 focus:outline-none shadow-xs ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Tooltip
              id="delete"
              Icon={FiTrash2}
              title={t("Delete")}
              bgColor="#e6533c"
            />
          </button>
        ) : null}
      </div>
    </>
  );
};

export default EditDeleteButton;
