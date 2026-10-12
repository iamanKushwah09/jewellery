import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2, FiZoomIn } from "react-icons/fi";
import Tooltip from "@/components/tooltip/Tooltip";
import { GrView } from "react-icons/gr";

const EditDeleteButtonTwo = ({
  id,
  title,
  handleUpdate,
  handleModalOpen,
  isCheck,
  product,
  parent,
  children,
  flag = false,
  isShow = false
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex justify-end text-right">
        

        {!isShow && !flag ? (
          <button
            disabled={isCheck?.length > 0}
            onClick={() => handleModalOpen(id, title, product)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-danger transition-colors focus:outline-none ${isCheck?.length > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Tooltip
              id="delete"
              Icon={FiTrash2}
              title={t("Delete")}
              bgColor="#DC2626"
            />
          </button>
        ) : null}
      </div>
    </>
  );
};

export default EditDeleteButtonTwo;
