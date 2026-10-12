import { TableBody, TableCell, TableRow, Button } from "@windmill/react-ui";
import React, { useState, useContext } from "react";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import MainDrawer from "@/components/drawer/MainDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ShowHideButton from "@/components/table/ShowHideButton";
import SaleDrawer from "../drawer/SaleDrawer";
import SaleOrderViewDrawer from "../drawer/SaleOrderViewDrawer";
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
                {isViewOnly ? (
                    <SaleOrderViewDrawer id={serviceId} onEdit={() => handleEdit(serviceId)} orderType="sale" />
                ) : (
                    <SaleDrawer id={serviceId} />
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
                orderType="sale"
            />
            <TableBody>
                {dataTable?.map((e) => (
                    <TableRow key={e._id}>
                        <TableCell
                            onClick={() => handleView(e._id)}
                            className="cursor-pointer text-sm font-bold bg-slate-100 dark:bg-gray-700 text-center hover:text-emerald-600"
                        >
                            <span>{e?.voucherNo?.trim()}</span>
                            {(e?.saleOrderVoucherNo || e?.saleOrder?.voucherNo) ? (
                                <span className="block mt-1 text-xs text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded px-1.5 py-0.5 max-w-fit mx-auto shadow-xs">
                                    SO: {(e.saleOrderVoucherNo || e.saleOrder?.voucherNo)?.trim()}
                                </span>
                            ) : null}
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
                            {((Number(e?.loyaltyDiscountAmount) || 0) + (Number(e?.loyaltyTierDiscountAmount) || 0) + (Number(e?.loyaltyCouponDiscountAmount) || 0)) > 0 && (
                                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    Loyalty: -₹{((Number(e?.loyaltyDiscountAmount) || 0) + (Number(e?.loyaltyTierDiscountAmount) || 0) + (Number(e?.loyaltyCouponDiscountAmount) || 0)).toFixed(2)}
                                </span>
                            )}
                            <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                                {e?.loyaltyTierName && (
                                    <span className="inline-block text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded px-1 font-semibold">
                                        ★ {e.loyaltyTierName}
                                    </span>
                                )}
                                {Number(e?.loyaltyPointsRedeemed) > 0 && (
                                    <span className="inline-block text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded px-1 font-mono font-bold" title="Loyalty Points Redeemed">
                                        −{e.loyaltyPointsRedeemed} pts
                                    </span>
                                )}
                                {Number(e?.loyaltyPointsEarned) > 0 && (
                                    <span className="inline-block text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded px-1 font-mono font-bold" title="Loyalty Points Earned">
                                        +{e.loyaltyPointsEarned} pts
                                    </span>
                                )}
                            </div>
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
