import { Avatar, TableBody, TableCell, TableRow } from "@windmill/react-ui";
import React from "react";
import { useHistory } from "react-router-dom";

//internal import

import Status from "@/components/table/Status";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import MainDrawer from "@/components/drawer/MainDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import ItemDrawer from "@/components/drawer/ItemDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ActiveInActiveButton from "@/components/table/ActiveInActiveButton";
import ShowHideButton from "@/components/table/ShowHideButton";
import Tooltip from "@/components/tooltip/Tooltip";
import Stock from "@/components/common/Stock";
import ItemImgUpdateDrawer from "@/components/drawer/ItemImgUpdateDrawer";
import ItemViewDrawer from "@/components/drawer/ItemViewDrawer";
import GmcServices from "@/services/GmcServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import { FiRefreshCw, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

const itemTable = ({ dataTable, isShow = true, onRefresh }) => {
    console.log("dataTable in itemTable: ", dataTable);
    const history = useHistory();
    const [retryingId, setRetryingId] = React.useState(null);

    const handleRetryGmc = async (id) => {
        setRetryingId(id);
        try {
            await GmcServices.retryProduct(id);
            notifySuccess("GMC sync job enqueued for product");
            if (typeof onRefresh === "function") onRefresh();
        } catch (err) {
            notifyError(err.response?.data?.message || err.message || "Failed to retry GMC sync");
        } finally {
            setRetryingId(null);
        }
    };

    const {
        title,
        serviceId,
        handleModalOpen,
        handleUpdate,
        handleView,
        handleEdit,
        isViewOnly,
        handleItemImgUpdate,
        isSubmitting,
        handleResetPassword,
        isImgUpdate
    } = useToggleDrawer();

    const { showDateFormat, showingTranslateValue } = useUtilsFunction();

    console.log(serviceId , 'serviceId')

    return (
        <>
            <DeleteModal id={serviceId} title={title} />
            <MainDrawer product={true}>
                {serviceId ? (
                    isImgUpdate ? (
                        <ItemImgUpdateDrawer id={serviceId} />
                    ) : isViewOnly ? (
                        <ItemViewDrawer id={serviceId} onEdit={() => handleEdit(serviceId)} />
                    ) : (
                        <ItemDrawer id={serviceId} />
                    )
                ) : <ItemDrawer id={serviceId} />}
            </MainDrawer>
            <TableBody>
                {dataTable?.map((role) => {
                    return (
                        <TableRow key={role._id}>
                            <TableCell>
                                <img 
                                    onClick={() => handleItemImgUpdate(role._id)}
                                    src={(() => {
                                        const img = Array.isArray(role?.image) ? role.image[0] : role?.image;
                                        let rawUrl = '';
                                        if (typeof img === 'object' && img !== null) {
                                            rawUrl = img.url || img.path || img.filePath || '';
                                        } else if (typeof img === 'string') {
                                            rawUrl = img;
                                        }
                                        if (!rawUrl) return 'https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png';
                                        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
                                        const socketUrl = import.meta.env.VITE_APP_API_SOCKET_URL || '';
                                        return `${socketUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                                    })()}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png';
                                    }}
                                    alt={role?.name || "Product"}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity shadow-xs"
                                />
                            </TableCell>
                            <TableCell>
                                <span
                                    onClick={() => handleView(role._id)}
                                    className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer transition-colors block max-w-xs truncate"
                                    title={role?.name}
                                >
                                    {role?.name}
                                </span>
                            </TableCell>
                            <TableCell><span className="text-sm">{role.alias}</span></TableCell>
                            <TableCell><span className="text-sm">{role.category_id?.name}</span></TableCell>
                            {/* <TableCell><span className="text-sm">{role.brand_id?.name}</span></TableCell> */}
                            <TableCell><span className="text-sm">{role.item_group_id?.name}</span></TableCell>
                            <TableCell><span className="text-sm">{role.unit_id?.name}</span></TableCell>
                            {/* <TableCell><span className="text-sm">{role.alternate_unit}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.conversion_factor}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.tax_gst}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.hsn_code}</span></TableCell> */}
                            <TableCell><span className="text-sm">{role.sale_price}</span></TableCell>
                            <TableCell><span className="text-sm">{role.mrp}</span></TableCell>
                            <TableCell>
                                <Stock stock={role.stock || 0} />
                            </TableCell>
                            {/* <TableCell><span className="text-sm">{role.discount}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.vendor_discount}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.specification}</span></TableCell>
                            <TableCell><span className="text-sm">{role.short_description}</span></TableCell>
                            <TableCell><span className="text-sm">{role.long_description}</span></TableCell> */}
                            {/* <TableCell><span className="text-sm">{role.specification && role.specification.length > 30 ? `${role.specification.slice(0, 30)}...` : role.specification}</span></TableCell>
                            <TableCell><span className="text-sm">{role.short_description && role.short_description.length > 30 ? `${role.short_description.slice(0, 30)}...` : role.short_description}</span></TableCell>
                            <TableCell><span className="text-sm">{role.long_description && role.long_description.length > 30 ? `${role.long_description.slice(0, 30)}...` : role.long_description}</span></TableCell> */}
                            {isShow ? <>
                                <TableCell className="text-center">
                                    <ShowHideButton id={role._id} status={role.showOnWebsite ?? true} field="showOnWebsite" />
                                    {role.item_group_id && typeof role.item_group_id === 'object' && role.item_group_id.showOnWebsite === false && (
                                        <span className="block text-[10px] text-red-500 font-medium leading-tight mt-1" title="Parent Item Group is hidden on website">
                                            (Group Hidden)
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <ShowHideButton id={role._id} status={role.is_active} field="is_active" />
                                </TableCell>
                                <TableCell className="text-center">
                                    {role.gmc?.status === 'SYNCED' ? (
                                        <span 
                                            title={`Synced to GMC${role.gmc?.lastSyncedAt ? ' on ' + new Date(role.gmc.lastSyncedAt).toLocaleString() : ''}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 cursor-default"
                                        >
                                            <FiCheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            Synced
                                        </span>
                                    ) : role.gmc?.status === 'SYNCING' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse cursor-default">
                                            <FiRefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                                            Syncing
                                        </span>
                                    ) : role.gmc?.status === 'FAILED' ? (
                                        <button
                                            onClick={() => handleRetryGmc(role._id)}
                                            disabled={retryingId === role._id}
                                            title={`Sync Failed: ${role.gmc?.lastError || 'Click to retry'}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 transition-colors"
                                        >
                                            <FiAlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                            <span>{retryingId === role._id ? "Retrying..." : "Failed ↻"}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRetryGmc(role._id)}
                                            disabled={retryingId === role._id}
                                            title="Click to sync with Google Merchant Center"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 transition-colors"
                                        >
                                            <FiClock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                            <span>{retryingId === role._id ? "Syncing..." : "Pending ↻"}</span>
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell className="action-col">
                                    <EditDeleteButton
                                        id={role._id}
                                        role={role}
                                        isSubmitting={isSubmitting}
                                        handleUpdate={handleUpdate}
                                        handleModalOpen={handleModalOpen}
                                        handleResetPassword={handleResetPassword}
                                        title={showingTranslateValue(role?.name)}
                                    />
                                </TableCell></> : <TableCell className="action-col">
                                <EditDeleteButton
                                    id={role._id}
                                    role={role}
                                    isSubmitting={isSubmitting}
                                    handleUpdate={handleUpdate}
                                    handleModalOpen={handleModalOpen}
                                    handleResetPassword={handleResetPassword}
                                    title={"View"}
                                    isShow
                                />
                            </TableCell>}
                        </TableRow>
                    )
                })}
            </TableBody>
        </>
    );
};

export default itemTable;
