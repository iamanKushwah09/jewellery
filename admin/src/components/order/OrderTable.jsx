import { TableBody, TableCell, TableRow } from "@windmill/react-ui";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FiZoomIn } from "react-icons/fi";
import { Link } from "react-router-dom";

//internal import

import Status from "@/components/table/Status";
import Tooltip from "@/components/tooltip/Tooltip";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import DeleteModal from "@/components/modal/DeleteModal";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import PrintReceipt from "@/components/form/others/PrintReceipt";
import SelectStatus from "@/components/form/selectOption/SelectStatus";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import OrderDrawer from "../drawer/OrderDrawer";
import MainDrawer from "../drawer/MainDrawer";
import EditDeleteButtonTwo from "../table/EditDeleteButtonTwo";
import SaleOrderViewDrawer from "../drawer/SaleOrderViewDrawer";
import dayjs from "dayjs";
const OrderTable = ({ orders }) => {
  // console.log('globalSetting',globalSetting)
  const { t } = useTranslation();
  const { showDateTimeFormat, currency, getNumberTwo } = useUtilsFunction();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null); // To store the selected row data
  const [visible, setVisible] = useState(false);

  // console.log('orders',orders)

  const {
    title,
    serviceId,
    handleModalOpen,
    handleUpdate,
    isSubmitting,
    handleResetPassword,
  } = useToggleDrawer();

  const handleOpen = (e) => {
    setSelectedData(e); // Store selected row data
    setIsModalOpen(true); // Open modal or drawer
    setVisible(true)
    // handleUpdate(e.id);

  }
  const handleClose = (e) => {
    setSelectedData(e); // Store selected row data
    // setIsModalOpen(true); // Open modal or drawer
    setVisible(false)
    // handleUpdate(e.id);

  }

  return (
    <>
      <DeleteModal id={serviceId} title={title} />

      <MainDrawer product>
        <OrderDrawer id={serviceId} />
      </MainDrawer>

      <TableBody className="dark:bg-[#1a2352]">
        {orders?.map((e, i) => (
          <TableRow key={i + 1} className="hover:bg-[#f0f1f7]/50 dark:hover:bg-white/[0.02] transition-colors border-b border-[#e9edf4] dark:border-[#263168]">
            <TableCell>
              <button
                type="button"
                onClick={() => handleOpen(e)}
                className="cursor-pointer inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#845adf]/10 text-[#845adf] hover:bg-[#845adf] hover:text-white transition-all shadow-xs"
              >
                #{e?.order_no || e?.invoiceNo || e?._id?.slice(-6)}
              </button>
            </TableCell>
            <TableCell>
              <span className="text-xs font-medium text-[#536485] dark:text-[#a3aed1]">
                {e?.order_date ? dayjs(e?.order_date).format("YYYY-MM-DD") : "N/A"}
              </span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#f0f1f7] dark:bg-[#111c43] text-[#536485] dark:text-[#a3aed1] border border-[#e9edf4] dark:border-[#263168]">
                {e?.payment_mode || "COD"}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-xs font-medium text-[#536485] dark:text-[#a3aed1]">
                {currency}{getNumberTwo(e?.shipping_charge || 0)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-xs font-bold text-[#2c3138] dark:text-white">
                {currency}{getNumberTwo(e?.total_amount || 0)}
              </span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#23b7e5]/10 text-xs font-bold text-[#23b7e5]">
                {e?.total_qty || 1}
              </span>
            </TableCell>

            <TableCell className="text-right">
              <EditDeleteButtonTwo
                id={e._id}
                role={e}
                isSubmitting={isSubmitting}
                handleUpdate={handleUpdate}
                handleModalOpen={handleModalOpen}
                handleResetPassword={handleResetPassword}
                title={e?.name}
              />
            </TableCell>
          </TableRow>
        ))}
        {/* <TableCell className="text-right flex justify-end">
          <div className="flex justify-between items-center">
            <PrintReceipt orderId={order._id} />

            <span className="p-2 cursor-pointer text-gray-400 hover:text-blue-600">
              <Link to={`/order/${order._id}`}>
                <Tooltip
                  id="view"
                  Icon={FiZoomIn}
                  title={t("ViewInvoice")}
                  bgColor="#059669"
                />
              </Link>
            </span>
          </div>
        </TableCell> */}
      </TableBody>
      {isModalOpen && selectedData && (
        // <ShowModal
        //      // Pass the selected row data to the modal
        // closeModal={closeModal}
        //             isSubmitting={isSubmitting}
        //             handleUpdate={handleUpdate}
        //             handleModalOpen={handleModalOpen}
        //             handleResetPassword={handleResetPassword}
        //             title={""}
        //             flag={true}
        // />
        <SaleOrderViewDrawer
          visible={visible}
          setVisible={setVisible}
          data={selectedData}
          handleClose={handleClose}
        />
      )}
    </>
  );
};

export default OrderTable;
