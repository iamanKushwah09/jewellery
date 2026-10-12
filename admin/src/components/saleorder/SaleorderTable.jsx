import { TableBody, TableCell, TableRow, Button } from "@windmill/react-ui";
import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import MainDrawer from "@/components/drawer/MainDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ShowHideButton from "@/components/table/ShowHideButton";
import SaleOrderDrawer from "../drawer/SaleOrderDrawer";
import SaleOrderViewDrawer from "../drawer/SaleOrderViewDrawer";
import SaleOrderServices from "@/services/SaleOrderServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import CustomerDetailsModal from "@/components/modal/CustomerDetailsModal";
import PrintSaleOrder from "./PrintSaleOrder";
import { FiEye, FiCheck, FiX } from "react-icons/fi";
import { SidebarContext } from "@/context/SidebarContext";

const SaleOrderTable = ({ dataTable }) => {
    const history = useHistory();
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const { setIsUpdate } = useContext(SidebarContext);

    const [sentStatus, setSentStatus] = useState(() => {
        try {
            const saved = localStorage.getItem("whatsapp_sent_status");
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const markAsSent = (orderId, type) => {
        const updated = { ...sentStatus, [orderId]: type };
        setSentStatus(updated);
        try {
            localStorage.setItem("whatsapp_sent_status", JSON.stringify(updated));
        } catch (err) {
            console.error("Failed to save sent status to localStorage", err);
        }
    };

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

    const { showDateFormat, showingTranslateValue } = useUtilsFunction();

    const handleViewCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setCustomerModalOpen(true);
    };

    const handleProcess = async (id) => {
        try {
            const response = await SaleOrderServices.processSaleOrder(id);
            if (response.status) {
                notifySuccess(response.message || "Sale order processed successfully");
                console.log(`Sale order ${id} processed successfully`);
                // Refresh the data to show updated busyApiStatus
                setIsUpdate(true);
            } else {
                notifyError(response.message || "Failed to process sale order");
            }
        } catch (error) {
            console.error("Error processing sale order:", error);
            notifyError(error?.response?.data?.message || "Error processing sale order");
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
                {isViewOnly ? (
                    <SaleOrderViewDrawer id={serviceId} onEdit={() => handleEdit(serviceId)} />
                ) : (
                    <SaleOrderDrawer id={serviceId} />
                )}
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
                            className="cursor-pointer text-base font-bold bg-slate-50 dark:bg-slate-800/50 text-center hover:text-primary transition-colors"
                            title="View Order Details"
                        >
                            <span className="hover:underline">{e?.voucherNo?.trim()}</span>
                        </TableCell>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 text-center hover:text-primary transition-colors"
                        >
                            {e?.customer?.group_type || "—"}
                        </TableCell>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer text-base font-bold bg-slate-50 dark:bg-slate-800/50 text-center text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
                        >
                            {e?.netAmount}
                        </TableCell>
                        <TableCell>
                            <h2 className="text-sm font-medium">
                                {e?.date?.split("T")[0]}
                            </h2>
                        </TableCell>
                        <TableCell>
                            <h2 className="text-sm font-medium">
                                {e?.saleType?.name}
                            </h2>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                    {e?.customer?.name || "N/A"}
                                </div>
                                {(e?.customer?.is_guest || e?.directCustomer) && (
                                    <Button
                                        layout="outline"
                                        size="icon"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleViewCustomerDetails(e.directCustomer || e.customer);
                                        }}
                                        className="ml-2 h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 dark:border-gray-700"
                                        title="View Customer Details"
                                    >
                                        <FiEye className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <h2 className="text-sm font-medium">
                                {e?.salesman?.name}
                            </h2>
                        </TableCell>
                        <TableCell className="text-center">
                            <ShowHideButton
                                id={e._id}
                                status={e.isActive}
                                disabled={e.busyApiStatus === 'SUCCESS'}
                            />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-end space-x-1.5">
                                <button
                                    onClick={() => handleView(e._id)}
                                    title="View Sale Order Details"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 focus:outline-none shadow-xs"
                                >
                                    <FiEye className="w-4 h-4" />
                                </button>
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
                                <button
                                    onClick={() => {
                                        const customer = e.directCustomer || e.customer;
                                        const name = customer?.name || "Customer";
                                        let phone = customer?.mobile || "";
                                        phone = phone.replace(/\D/g, "");
                                        if (phone.startsWith("0")) {
                                            phone = phone.substring(1);
                                        }
                                        if (phone && phone.length === 10) {
                                            phone = "91" + phone;
                                        }
                                        console.log("WhatsApp redirect details:", { name, phone, voucherNo: e.voucherNo });
                                        const voucherNo = e.voucherNo || "";
                                        const text = encodeURIComponent(`Hello ${name}, your order ${voucherNo} has been confirmed.`);
                                        window.open(`https://api.whatsapp.com/send/?phone=${phone}&text=${text}`, '_blank');
                                        markAsSent(e._id, 'confirm');
                                    }}
                                    title="Confirm & Send WhatsApp"
                                    className={`p-1.5 rounded-md border focus:outline-none transition-colors duration-150 ${
                                        sentStatus[e._id] === 'confirm'
                                            ? "text-green-600 bg-green-100 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800"
                                            : "text-gray-400 border-gray-200 hover:text-green-600 hover:bg-green-50 hover:border-green-200 dark:border-gray-700 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        const customer = e.directCustomer || e.customer;
                                        const name = customer?.name || "Customer";
                                        let phone = customer?.mobile || "";
                                        phone = phone.replace(/\D/g, "");
                                        if (phone.startsWith("0")) {
                                            phone = phone.substring(1);
                                        }
                                        if (phone && phone.length === 10) {
                                            phone = "91" + phone;
                                        }
                                        console.log("WhatsApp redirect details:", { name, phone, voucherNo: e.voucherNo });
                                        const voucherNo = e.voucherNo || "";
                                        const text = encodeURIComponent(`Hello ${name}, your order ${voucherNo} has been canceled.`);
                                        window.open(`https://api.whatsapp.com/send/?phone=${phone}&text=${text}`, '_blank');
                                        markAsSent(e._id, 'cancel');
                                    }}
                                    title="Cancel & Send WhatsApp"
                                    className={`p-1.5 rounded-md border focus:outline-none transition-colors duration-150 ${
                                        sentStatus[e._id] === 'cancel'
                                            ? "text-red-600 bg-red-100 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800"
                                            : "text-gray-400 border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:border-gray-700 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
};

export default SaleOrderTable;
