import { TableBody, TableCell, TableRow, Button } from "@windmill/react-ui";
import React, { useState, useContext } from "react";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import MainDrawer from "@/components/drawer/MainDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ShowHideButton from "@/components/table/ShowHideButton";
import SaleDrawer from "../drawer/SaleDrawer";
import SaleServices from "@/services/SaleServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import CustomerDetailsModal from "@/components/modal/CustomerDetailsModal";
import PrintSaleOrder from "../saleorder/PrintSaleOrder";
import { FiEye, FiAward } from "react-icons/fi";
import { SidebarContext } from "@/context/SidebarContext";

const SaleTable = ({ dataTable }) => {
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const { setIsUpdate } = useContext(SidebarContext);

    const {
        title,
        serviceId,
        handleModalOpen,
        handleUpdate,
        handleView,
        isViewOnly,
        handleEdit,
        isSubmitting,
        handleResetPassword,
    } = useToggleDrawer();

    const { showDateFormat } = useUtilsFunction();

    const handleViewCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setCustomerModalOpen(true);
    };

    const handleProcess = async (id) => {
        try {
            const response = await SaleServices.processSale(id);
            if (response.status) {
                notifySuccess(response.message || "Sale processed successfully");
                setIsUpdate(true);
            } else {
                notifyError(response.message || "Failed to process sale");
            }
        } catch (error) {
            console.error("Error processing sale:", error);
            notifyError(error?.response?.data?.message || "Error processing sale");
        }
    };

    const handlePrint = (id) => {
        setSelectedOrderId(id);
        setPrintModalOpen(true);
    };

    const handleClosePrintModal = () => {
        setPrintModalOpen(false);
        setSelectedOrderId(null);
    };

    return (
        <>
            <DeleteModal id={serviceId} title={title} />
            <MainDrawer product={true}>
                <SaleDrawer id={serviceId} isViewOnly={isViewOnly} />
            </MainDrawer>
            <CustomerDetailsModal
                isOpen={customerModalOpen}
                onClose={() => {
                    setCustomerModalOpen(false);
                    setSelectedCustomer(null);
                }}
                customer={selectedCustomer}
            />
            <PrintSaleOrder
                isOpen={printModalOpen}
                onClose={handleClosePrintModal}
                orderId={selectedOrderId}
            />
            <TableBody>
                {dataTable?.map((e) => (
                    <TableRow key={e._id}>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer text-sm font-bold bg-slate-100 dark:bg-gray-700 text-center hover:text-emerald-600"
                        >
                            {e?.voucherNo}
                        </TableCell>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer text-xs font-semibold text-center"
                        >
                            {e?.customer?.group_type || "-"}
                        </TableCell>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer font-bold text-center"
                        >
                            <span>₹{Number(e?.netAmount || e?.totalAmount || 0).toFixed(2)}</span>
                            {e?.loyaltyDiscountAmount > 0 && (
                                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                                    Loyalty: -₹{Number(e.loyaltyDiscountAmount).toFixed(2)}
                                </span>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className="text-xs">
                                {e?.date ? new Date(e.date).toLocaleDateString('en-IN') : "-"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className="text-xs font-medium">
                                {e?.saleType?.name || "-"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    {e?.customer?.name || "N/A"}
                                </span>
                                {(e?.customer?.is_guest || e?.directCustomer) && (
                                    <Button
                                        layout="outline"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleViewCustomerDetails(e.directCustomer || e.customer);
                                        }}
                                        className="ml-2 p-1 h-6 w-6"
                                        title="View Customer Details"
                                    >
                                        <FiEye className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="text-xs">
                                {e?.salesman?.name || "General"}
                            </span>
                        </TableCell>
                        <TableCell className="text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                e?.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                e?.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                                {e?.status || "Completed"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <EditDeleteButton
                                id={e._id}
                                role={e}
                                isSubmitting={isSubmitting}
                                handleUpdate={handleEdit}
                                handleModalOpen={handleModalOpen}
                                handleResetPassword={handleResetPassword}
                                handleProcess={handleProcess}
                                handlePrint={handlePrint}
                                title={""}
                                busyApiStatus={e.busyApiStatus}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
};

export default SaleTable;
