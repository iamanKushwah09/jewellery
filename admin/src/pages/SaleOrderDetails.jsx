import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Table,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  TableBody,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiEdit,
  FiPrinter,
  FiCheck,
  FiX,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiFileText,
  FiShoppingBag,
  FiDollarSign,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import SaleOrderServices from "@/services/SaleOrderServices";
import Loading from "@/components/preloader/Loading";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import PrintSaleOrder from "@/components/saleorder/PrintSaleOrder";
import MainDrawer from "@/components/drawer/MainDrawer";
import SaleOrderDrawer from "@/components/drawer/SaleOrderDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import AnimatedContent from "@/components/common/AnimatedContent";
import { notifySuccess, notifyError } from "@/utils/toast";

const PLACEHOLDER_IMG =
  "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";

const formatImageUrl = (img) => {
  if (!img) return PLACEHOLDER_IMG;
  let rawUrl = "";
  if (typeof img === "object" && img !== null) {
    rawUrl = img.url || img.path || img.filePath || img.base64File || "";
  } else if (typeof img === "string") {
    rawUrl = img;
  }
  if (!rawUrl) return PLACEHOLDER_IMG;
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const socketUrl = import.meta.env.VITE_APP_API_SOCKET_URL || "";
  return `${socketUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
};

const SaleOrderDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const { t } = useTranslation();
  const { showDateFormat, currency = "₹" } = useUtilsFunction();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const { title, serviceId, handleEdit } = useToggleDrawer();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await SaleOrderServices.getSaleOrderById(id);
      if (res) {
        setOrder(res);
      } else {
        setError("Sale order not found");
      }
    } catch (err) {
      console.error("Error loading sale order details:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load sale order");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!window.confirm(`Are you sure you want to convert Sale Order ${order?.voucherNo} to an official Sale Invoice?`)) {
      return;
    }
    try {
      setConverting(true);
      const res = await SaleOrderServices.convertToSale(id);
      if (res?.success) {
        notifySuccess(res.message || "Sale Order successfully converted to Sale Invoice!");
        await fetchOrderDetails();
      } else {
        notifyError(res?.message || "Failed to convert to Sale Invoice");
      }
    } catch (err) {
      console.error("Error converting sale order to sale:", err);
      notifyError(err?.response?.data?.message || err?.message || "Error converting order to sale");
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const handleSendWhatsApp = (type = "confirm") => {
    if (!order) return;
    const customer = order.directCustomer || order.customer;
    const name = customer?.name || "Customer";
    let phone = customer?.mobile || "";
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = phone.substring(1);
    }
    if (phone && phone.length === 10) {
      phone = "91" + phone;
    }
    const voucherNo = order.voucherNo || "";
    const msg =
      type === "confirm"
        ? `Hello ${name}, your order ${voucherNo} has been confirmed. Net Total: ${currency} ${order.netAmount || ""}. Thank you for your business!`
        : `Hello ${name}, your order ${voucherNo} has been canceled. Please contact us for further queries.`;
    const text = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send/?phone=${phone}&text=${text}`, "_blank");
  };

  if (loading) {
    return <Loading loading={loading} />;
  }

  if (error || !order) {
    return (
      <div className="py-12 text-center">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sale Order Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error || "The requested sale order could not be loaded."}</p>
          <Button
            onClick={() => history.push("/sale-order")}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Sale Orders</span>
          </Button>
        </div>
      </div>
    );
  }

  const customer = order.directCustomer || order.customer || {};
  const items = order.items || [];
  const billSundries = order.billSundries || {};

  return (
    <>
      <MainDrawer product={true}>
        <SaleOrderDrawer id={serviceId || id} />
      </MainDrawer>

      <PrintSaleOrder
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        orderId={order._id}
      />

      <AnimatedContent>
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => history.push("/sale-order")}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
              title="Back to Sale Orders"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sale Order</span>
                {order.voucherNo && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                    #{order.voucherNo}
                  </span>
                )}
                {order.busyApiStatus === "SUCCESS" ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    BUSY: Posted
                  </span>
                ) : order.busyApiStatus === "FAILED" ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    BUSY: Failed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    BUSY: Pending
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 font-serif leading-tight">
                Order #{order.voucherNo || "Draft"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => fetchOrderDetails()}
              layout="outline"
              className="h-10 px-3 rounded-lg border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5 text-xs font-medium"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={() => setPrintModalOpen(true)}
              className="h-10 px-4 rounded-lg bg-[#23b7e5] hover:bg-[#1ea5cf] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-button"
            >
              <FiPrinter className="w-4 h-4" />
              <span>Print Invoice</span>
            </Button>

            <Button
              onClick={() => handleSendWhatsApp("confirm")}
              className="h-10 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-button"
              title="Send WhatsApp Confirmation"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>

            {order.busyApiStatus !== "SUCCESS" && (
              <Button
                onClick={() => handleEdit(order._id)}
                className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <FiEdit className="w-4 h-4" />
                <span>Edit Order</span>
              </Button>
            )}

            {order.invoicedStatus === "Fully Billed" ? (
              <Badge type="success" className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <FiCheckCircle className="w-4 h-4" />
                <span>Invoiced: {order.saleVoucherNo || "Billed"}</span>
              </Badge>
            ) : (
              <Button
                onClick={handleConvertToSale}
                disabled={converting || order.status === "Cancelled"}
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-button text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Convert this Sale Order to Tax Sale Invoice"
              >
                <FiFileText className="w-4 h-4" />
                <span>{converting ? "Converting..." : "Convert to Sale"}</span>
              </Button>
            )}

            <Button
              onClick={() => history.push("/sale-order")}
              layout="outline"
              className="h-10 px-3.5 rounded-lg border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium"
            >
              Back
            </Button>
          </div>
        </div>

        {/* Information Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Customer Card */}
          <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
            <CardBody className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-primary" />
                  Customer Information
                </span>
                {customer.is_guest && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Guest
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100">{customer.name || "N/A"}</h4>
                {customer.code && (
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">Code: {customer.code}</span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                {customer.mobile && (
                  <p className="flex items-center gap-2">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{customer.mobile}</span>
                  </p>
                )}
                {customer.email && (
                  <p className="flex items-center gap-2">
                    <FiMail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </p>
                )}
                {(customer.address || customer.pincode) && (
                  <p className="flex items-start gap-2">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      {customer.address} {customer.pincode ? ` - ${customer.pincode}` : ""}
                    </span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-400 block">GST Type</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{customer.gst_type || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">GST No</span>
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{customer.gst_no || "N/A"}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Order Details Card */}
          <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
            <CardBody className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <FiFileText className="w-4 h-4 text-primary" />
                  Order Meta
                </span>
                <span className="text-xs text-gray-400">{order.date ? showDateFormat(order.date) : "—"}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Voucher No</span>
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{order.voucherNo || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Order Date</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {order.date ? order.date.split("T")[0] : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Sale Type</span>
                  <span className="font-semibold text-primary">{order.saleType?.name || order.saleType || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Salesman</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{order.salesman?.name || order.salesman || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Material Centre</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{order.matCentre || "RETAIL"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Group Type</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{customer.group_type || "—"}</span>
                </div>
              </div>

              {order.narration && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                  <span className="text-gray-400 block mb-0.5">Narration / Remarks</span>
                  <p className="text-gray-600 dark:text-gray-300 italic">{order.narration}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Financial Overview Card */}
          <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
            <CardBody className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiDollarSign className="w-4 h-4 text-emerald-600" />
                    Financial Summary
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    {items.length} Items
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Total Quantity:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {billSundries.totalQuantity || order.totalQuantity || items.reduce((acc, it) => acc + Number(it.quantity || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Gross Amount:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {currency} {Number(billSundries.totalAmount || order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  {(billSundries.totalDiscountAmount || billSundries.totalDiscountSundries) && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Total Discounts:</span>
                      <span className="font-semibold">
                        -{currency} {(Number(billSundries.totalDiscountAmount || 0) + Number(billSundries.totalDiscountSundries || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {billSundries.totalHammli > 0 && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Hamali Charges:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {currency} {Number(billSundries.totalHammli || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold block">Net Payable</span>
                    <span className="text-2xl font-extrabold text-purple-900 dark:text-purple-100 font-serif">
                      {currency} {Number(order.netAmount || billSundries.totalNetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-white dark:bg-purple-900/70 text-purple-700 dark:text-purple-200 rounded-lg shadow-2xs">
                    {order.isActive ? "Active" : "Closed"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Order Items Table Card */}
        <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-6">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5 text-primary" />
                <span>Ordered Items ({items.length})</span>
              </h3>
            </div>

            <TableContainer className="rounded-xl border border-gray-100 dark:border-gray-700/60">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>#</TableCell>
                    <TableCell>Product Details</TableCell>
                    <TableCell>HSN</TableCell>
                    <TableCell>Color / Size</TableCell>
                    <TableCell className="text-center">Qty</TableCell>
                    <TableCell className="text-right">List Price</TableCell>
                    <TableCell className="text-right">Discount</TableCell>
                    <TableCell className="text-right">Price</TableCell>
                    <TableCell className="text-right">Amount</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {items.map((it, idx) => {
                    const itImg = it.image || it.itemId?.image || it.itemId?.default_image;
                    const imgUrl = formatImageUrl(itImg);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <span className="text-xs font-mono text-gray-400">{idx + 1}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={imgUrl}
                              alt={it.name || "Product"}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMG;
                              }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {it.name || it.itemId?.name || "Product Item"}
                              </p>
                              {it.itemId?._id && (
                                <button
                                  onClick={() => history.push(`/item/${it.itemId._id}`)}
                                  className="text-[11px] text-primary hover:underline"
                                >
                                  View Item
                                </button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {it.hsn || it.itemId?.hsn_code || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{it.color || "—"}</span>
                            {it.size && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {it.size}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-xs text-gray-800 dark:text-gray-100">
                            {it.quantity}{" "}
                            <span className="text-[10px] font-normal text-gray-400">
                              {typeof it.unit === "object" ? it.unit?.label : it.unit || ""}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-serif">
                            {currency} {Number(it.listPrice || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {Number(it.discount || 0) > 0 ? `${it.discount}%` : "0%"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 font-serif">
                            {currency} {Number(it.price || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-serif">
                            {currency} {Number(it.amount || 0).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Detailed Financial & Tax Calculations Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-6 space-y-4">
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
              <CardBody className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                  <FiLayers className="w-4 h-4 text-primary" />
                  Tax Breakdown (GST)
                </h4>

                <div className="space-y-2.5 text-xs">
                  {billSundries.totalCgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">CGST Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalCgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {billSundries.totalSgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">SGST Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalSgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {billSundries.totalIgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">IGST Amount (Integrated)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalIgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {!billSundries.totalCgstSundries && !billSundries.totalSgstSundries && !billSundries.totalIgstSundries && (
                    <p className="text-gray-400 italic">Inclusive / No separate GST sundry line items applied.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
              <CardBody className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                  <FiDollarSign className="w-4 h-4 text-primary" />
                  Bill Calculation Summary
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400">Total Item Amount (Gross):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {currency} {Number(billSundries.totalAmount || order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                    <span>Total Item Discount:</span>
                    <span className="font-semibold">
                      -{currency} {Number(billSundries.totalDiscountAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  {billSundries.totalDiscountSundries > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                      <span>Sundry / Vendor Discount:</span>
                      <span className="font-semibold">
                        -{currency} {Number(billSundries.totalDiscountSundries).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {billSundries.totalHammli > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400">Hamali / Labor:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        +{currency} {Number(billSundries.totalHammli).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-800 dark:text-gray-100">Final Net Amount:</span>
                    <span className="text-lg text-primary font-serif">
                      {currency} {Number(order.netAmount || billSundries.totalNetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </AnimatedContent>
    </>
  );
};

export default SaleOrderDetails;
