import React, { useState, useEffect, useContext } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  TableBody,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import {
  FiEdit,
  FiPrinter,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiFileText,
  FiShoppingBag,
  FiDollarSign,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import SaleOrderServices from "@/services/SaleOrderServices";
import SaleServices from "@/services/SaleServices";
import Loading from "@/components/preloader/Loading";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { SidebarContext } from "@/context/SidebarContext";
import PrintSaleOrder from "@/components/saleorder/PrintSaleOrder";

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

const SaleOrderViewDrawer = ({ id, onEdit, orderType = "saleorder" }) => {
  const { t } = useTranslation();
  const { toggleDrawer } = useContext(SidebarContext);
  const { showDateFormat, currency = "₹" } = useUtilsFunction();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchOrder = async () => {
        try {
          let res;
          if (orderType === "sale") {
            try {
              res = await SaleServices.getSaleById(id);
            } catch (err) {
              res = await SaleOrderServices.getSaleOrderById(id);
            }
          } else {
            try {
              res = await SaleOrderServices.getSaleOrderById(id);
            } catch (err) {
              res = await SaleServices.getSaleById(id);
            }
          }
          setOrder(res?.data || res);
        } catch (err) {
          console.error("Error fetching order for view drawer:", err);
          setOrder(null);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, orderType]);

  const handleSendWhatsApp = (type = "confirm") => {
    if (!order) return;
    const customer = order.directCustomer || order.customer;
    const name = customer?.name || "Customer";
    let phone = customer?.mobile || "";
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = phone.substring(1);
    if (phone && phone.length === 10) phone = "91" + phone;

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

  if (!order) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p>{orderType === "sale" ? "Sale invoice" : "Sale order"} not found or could not be loaded.</p>
      </div>
    );
  }

  const customer = order.directCustomer || order.customer || {};
  const items = order.items || [];
  const billSundries = order.billSundries || {};

  return (
    <>
      <PrintSaleOrder
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        orderId={order._id}
        orderType={orderType}
      />

      {/* Header matching Title */}
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <div className="flex md:flex-row flex-col justify-between items-start md:items-center mr-20 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs uppercase font-semibold text-primary">View Mode</span>
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
            <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-serif">
              {orderType === "sale" ? "Sale Invoice" : "Sale Order"} #{order.voucherNo || "Draft"}
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setPrintModalOpen(true)}
              className="h-8 px-3 rounded-lg bg-[#23b7e5] hover:bg-[#1ea5cf] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FiPrinter className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>

            <Button
              onClick={() => handleSendWhatsApp("confirm")}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              title="WhatsApp"
            >
              <FaWhatsapp className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </Button>

            {onEdit && order.busyApiStatus !== "SUCCESS" && (
              <Button
                onClick={onEdit}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <FiEdit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Body with Scrollbars */}
      <Scrollbars className="w-full relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody className="p-6 space-y-6 pb-32">
            {/* Customer & Order Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiUser className="w-3.5 h-3.5 text-primary" />
                    Customer Details
                  </span>
                  {customer.is_guest && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Guest
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="text-base font-bold text-gray-800 dark:text-gray-100">{customer.name || "N/A"}</h5>
                  {customer.code && (
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">Code: {customer.code}</span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  {customer.mobile && (
                    <p className="flex items-center gap-1.5">
                      <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{customer.mobile}</span>
                    </p>
                  )}
                  {customer.email && (
                    <p className="flex items-center gap-1.5">
                      <FiMail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </p>
                  )}
                  {(customer.address || customer.pincode) && (
                    <p className="flex items-start gap-1.5">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{customer.address} {customer.pincode ? ` - ${customer.pincode}` : ""}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block">GST Type</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{customer.gst_type || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">GST No</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{customer.gst_no || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Order Meta Box */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiFileText className="w-3.5 h-3.5 text-primary" />
                    Order Info
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {order.date ? order.date.split("T")[0] : "—"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Voucher No</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{order.voucherNo || "—"}</span>
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
                </div>

                {order.narration && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                    <span className="text-gray-400 block mb-0.5">Narration</span>
                    <p className="text-gray-600 dark:text-gray-300 italic">{order.narration}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <FiShoppingBag className="w-4 h-4 text-primary" />
                  Ordered Items ({items.length})
                </h5>
              </div>

              <TableContainer className="rounded-xl border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>#</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>HSN</TableCell>
                      <TableCell>Color / Size</TableCell>
                      <TableCell className="text-center">Qty</TableCell>
                      <TableCell className="text-right">List Price</TableCell>
                      <TableCell className="text-right">Disc %</TableCell>
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
                            <span className="text-xs text-gray-400">{idx + 1}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                src={imgUrl}
                                alt="Item"
                                className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-700"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = PLACEHOLDER_IMG;
                                }}
                              />
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                                {it.name || it.itemId?.name || "Product"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {it.hsn || it.itemId?.hsn_code || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span>{it.color || "—"}</span>
                              {it.size && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 font-mono">
                                  {it.size}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-xs">
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
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-serif">
                              {currency} {Number(it.amount || 0).toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Bill Summary and Taxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Taxes Box */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 space-y-2">
                <h6 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                  <FiLayers className="w-3.5 h-3.5 text-primary" />
                  Tax Breakdown
                </h6>
                <div className="space-y-1.5 text-xs">
                  {billSundries.totalCgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">CGST Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalCgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {billSundries.totalSgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">SGST Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalSgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {billSundries.totalIgstSundries > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">IGST Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency} {Number(billSundries.totalIgstSundries).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {!billSundries.totalCgstSundries && !billSundries.totalSgstSundries && !billSundries.totalIgstSundries && (
                    <p className="text-gray-400 italic">Inclusive / No separate GST lines applied.</p>
                  )}
                </div>
              </div>

              {/* Financial Totals Box */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 space-y-2">
                <h6 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                  <FiDollarSign className="w-3.5 h-3.5 text-primary" />
                  Bill Totals
                </h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Quantity:</span>
                    <span className="font-semibold">{billSundries.totalQuantity || order.totalQuantity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Gross:</span>
                    <span className="font-semibold">
                      {currency} {Number(billSundries.totalAmount || order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  {billSundries.totalDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Item Discounts:</span>
                      <span className="font-semibold">-{currency} {Number(billSundries.totalDiscountAmount).toLocaleString()}</span>
                    </div>
                  )}
                  {billSundries.totalDiscountSundries > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Sundry Discounts:</span>
                      <span className="font-semibold">-{currency} {Number(billSundries.totalDiscountSundries).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(order.loyaltyTierDiscountAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Tier ({order.loyaltyTierName || "Silver"}) Discount:</span>
                      <span className="font-semibold">-{currency} {Number(order.loyaltyTierDiscountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order.loyaltyCouponDiscountAmount || 0) > 0 && (
                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>Coupon ({order.loyaltyCouponCode || "VOUCHER"}):</span>
                      <span className="font-semibold">-{currency} {Number(order.loyaltyCouponDiscountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order.loyaltyPointsRedeemed || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Points Redeemed ({order.loyaltyPointsRedeemed} pts):</span>
                      <span className="font-semibold">-{currency} {Number(order.loyaltyDiscountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {billSundries.totalHammli > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hamali:</span>
                      <span className="font-semibold">+{currency} {Number(billSundries.totalHammli).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-bold">
                    <span>Net Amount:</span>
                    <span className="text-base text-primary font-serif">
                      {currency} {Number(order.netAmount || billSundries.totalNetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </Scrollbars>

      {/* Sticky Bottom Bar matching DrawerButton */}
      <div className="sticky bottom-0 z-20 w-full py-3.5 px-6 flex items-center justify-end gap-3 bg-white dark:bg-[#1a2352] border-t border-[#e9edf4] dark:border-[#263168] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] mt-auto">
        <Button
          onClick={toggleDrawer}
          className="h-10 px-5 border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43] text-[#4b5563] dark:text-[#a3aed1] hover:bg-gray-50 dark:hover:bg-[#1e2753] font-medium rounded-lg transition-colors"
          layout="outline"
        >
          {t("Close") || "Close"}
        </Button>

        <Button
          onClick={() => setPrintModalOpen(true)}
          className="h-10 px-5 rounded-lg font-medium bg-[#23b7e5] hover:bg-[#1ea5cf] text-white shadow-sm transition-colors flex items-center gap-1.5"
        >
          <FiPrinter className="w-4 h-4" />
          <span>Print Invoice</span>
        </Button>

        {onEdit && order.busyApiStatus !== "SUCCESS" && (
          <Button
            onClick={onEdit}
            className="h-10 px-6 rounded-lg font-medium bg-[#845adf] hover:bg-[#7248cf] text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FiEdit className="w-4 h-4" />
            <span>Edit Order</span>
          </Button>
        )}
      </div>
    </>
  );
};

export default SaleOrderViewDrawer;
