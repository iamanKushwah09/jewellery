import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter, Button, Input, Table, TableHeader, TableCell, TableBody, TableRow, TableContainer, Badge } from "@windmill/react-ui";
import { FiFileText, FiSearch, FiRefreshCw, FiCheckCircle, FiX, FiArrowRight } from "react-icons/fi";
import SaleServices from "@/services/SaleServices";
import { notifySuccess, notifyError } from "@/utils/toast";

const ConvertSaleOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [convertingId, setConvertingId] = useState(null);

  const fetchUnbilledOrders = async () => {
    try {
      setLoading(true);
      const res = await SaleServices.getUnbilledSaleOrders();
      if (res?.success) {
        setOrders(res.data || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching unbilled orders:", err);
      notifyError(err?.response?.data?.message || "Failed to load unbilled sale orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnbilledOrders();
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleConvert = async (order) => {
    if (!order) return;
    try {
      setConvertingId(order._id);
      const res = await SaleServices.convertSaleOrderToSale(order._id);
      if (res?.success) {
        notifySuccess(res.message || `Order ${order.voucherNo} converted to Sale Invoice!`);
        // Remove converted order from list
        setOrders(prev => prev.filter(o => o._id !== order._id));
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        notifyError(res?.message || "Failed to convert sale order");
      }
    } catch (err) {
      console.error("Conversion error:", err);
      notifyError(err?.response?.data?.message || err?.message || "Error converting order to sale");
    } finally {
      setConvertingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const vch = (order.voucherNo || "").toLowerCase();
    const cust = (order.customer?.name || order.directCustomer?.name || "").toLowerCase();
    const mobile = (order.customer?.mobile || order.directCustomer?.mobile || "").toLowerCase();
    return vch.includes(term) || cust.includes(term) || mobile.includes(term);
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBody className="custom-modal p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Convert Sale Order to Sale Invoice
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select an unbilled Sale Order to generate an official Tax Sale Invoice
              </p>
            </div>
          </div>
          <button
            onClick={fetchUnbilledOrders}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh list"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="my-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Voucher No, Customer name, or Mobile..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
          </div>
        </div>

        {/* Content Table / List */}
        <div className="max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs">
              <FiRefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
              <span>Loading unbilled Sale Orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <FiCheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold">No Pending Unbilled Orders</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? "No orders match your search." : "All active Sale Orders have been converted to Sale Invoices!"}
              </p>
            </div>
          ) : (
            <TableContainer className="rounded-lg border border-gray-100 dark:border-gray-700">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell className="text-xs">Voucher No</TableCell>
                    <TableCell className="text-xs">Customer</TableCell>
                    <TableCell className="text-xs">Date</TableCell>
                    <TableCell className="text-xs text-right">Net Amount</TableCell>
                    <TableCell className="text-xs text-center">Action</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const customerName = order.directCustomer?.name || order.customer?.name || "Direct Customer";
                    const mobile = order.directCustomer?.mobile || order.customer?.mobile || "";
                    const isConverting = convertingId === order._id;

                    return (
                      <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                            {order.voucherNo}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {order.items?.length || 0} items
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
                            {customerName}
                          </span>
                          {mobile && (
                            <span className="text-[11px] text-gray-400 block">
                              {mobile}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {order.date ? new Date(order.date).toLocaleDateString('en-IN') : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            ₹{Number(order.netAmount || order.totalAmount || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            onClick={() => handleConvert(order)}
                            disabled={isConverting}
                            size="small"
                            className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1 shadow-sm transition-all"
                          >
                            <span>{isConverting ? "Converting..." : "Convert"}</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Showing {filteredOrders.length} unbilled order(s)
        </span>
        <Button
          layout="outline"
          onClick={onClose}
          className="h-9 px-4 rounded-lg text-xs"
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConvertSaleOrderModal;
