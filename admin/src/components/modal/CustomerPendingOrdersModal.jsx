import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter, Button } from "@windmill/react-ui";
import {
  FiFileText,
  FiCalendar,
  FiPackage,
  FiArrowRight,
  FiX,
  FiCheckSquare,
  FiSquare,
  FiCheck,
  FiLayers
} from "react-icons/fi";

const CustomerPendingOrdersModal = ({
  isOpen,
  onClose,
  customerName,
  orders = [],
  onSelectOrders,
}) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Auto-select the first order by default when modal opens
  useEffect(() => {
    if (isOpen && orders.length > 0) {
      setSelectedOrderIds([orders[0]._id]);
    } else {
      setSelectedOrderIds([]);
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o._id));
    }
  };

  const handleConfirmSelected = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o._id));
    if (selectedOrders.length > 0) {
      onSelectOrders(selectedOrders);
    }
  };

  const handleQuickLoadSingle = (order) => {
    onSelectOrders([order]);
  };

  const totalSelectedAmount = orders
    .filter(o => selectedOrderIds.includes(o._id))
    .reduce((sum, o) => sum + Number(o.netAmount || o.totalAmount || 0), 0);

  const totalSelectedItems = orders
    .filter(o => selectedOrderIds.includes(o._id))
    .reduce((sum, o) => sum + (o.items?.length || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBody className="custom-modal p-6 max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <FiLayers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>Pending Sale Orders Found</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
                  {orders.length} Order{orders.length > 1 ? "s" : ""}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Party: <strong className="text-gray-700 dark:text-gray-200">{customerName || "Customer"}</strong>. Select which order(s) you want to convert into this Sale Invoice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Business Logic Info Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
          <span className="text-base leading-none">💡</span>
          <span>
            <strong>Flexibility Note:</strong> When you load an order, all items enter the Sale Drawer where you can adjust billed quantities (e.g. bill 4 units even if 10 were ordered), edit rates/discounts, or add/remove items before final saving. Any unbilled quantity remains pending.
          </span>
        </div>

        {/* Action / Select All Bar */}
        {orders.length > 1 && (
          <div className="mt-3 flex items-center justify-between px-1 py-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {selectedOrderIds.length === orders.length ? (
                <>
                  <FiCheckSquare className="w-4 h-4" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <FiSquare className="w-4 h-4" />
                  <span>Select All ({orders.length} Orders)</span>
                </>
              )}
            </button>
            <span className="text-xs text-gray-400">
              {selectedOrderIds.length} of {orders.length} order(s) selected
            </span>
          </div>
        )}

        {/* Orders List */}
        <div className="my-3 max-h-[420px] overflow-y-auto space-y-3 pr-1">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">
              No pending sale orders found for this party.
            </div>
          ) : (
            orders.map((order) => {
              const isSelected = selectedOrderIds.includes(order._id);
              const itemsCount = order.items?.length || 0;
              const totalOrderedQty = order.totalOrderedQty || order.totalQuantity || order.items?.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;
              const totalBilledQty = order.totalBilledQty || 0;
              const totalPendingQty = order.totalPendingQty !== undefined ? order.totalPendingQty : Math.max(0, totalOrderedQty - totalBilledQty);
              const netAmount = Number(order.netAmount || order.totalAmount || 0);
              const isPartiallyBilled = order.invoicedStatus === 'Partially Billed' || totalBilledQty > 0;

              return (
                <div
                  key={order._id}
                  onClick={() => toggleSelectOrder(order._id)}
                  className={`p-4 rounded-xl border transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500 ring-2 ring-indigo-400/30"
                      : "border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/80 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Checkbox indicator */}
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className="text-xs font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md">
                        {order.voucherNo?.trim() || "Order"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {order.date ? new Date(order.date).toLocaleDateString("en-IN") : "-"}
                      </span>
                      {order.saleType?.name && (
                        <span className="text-[11px] text-gray-500 bg-slate-50 dark:bg-gray-700/50 px-2 py-0.5 rounded">
                          {order.saleType.name}
                        </span>
                      )}
                      {isPartiallyBilled ? (
                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
                          Partially Billed ({totalBilledQty}/{totalOrderedQty} done, {totalPendingQty} left)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                          Unbilled ({totalOrderedQty} qty)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1.5">Net Total:</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{netAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-2.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mb-1.5">
                      <FiPackage className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold">
                        {itemsCount} Items ({totalPendingQty} units pending to bill):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {order.items?.map((it, idx) => {
                        const itOrdered = it.orderedQty || it.quantity || 0;
                        const itBilled = it.billedQty || 0;
                        const itPending = it.pendingQty !== undefined ? it.pendingQty : Math.max(0, itOrdered - itBilled);

                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md border ${
                              itBilled > 0
                                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {it.name || it.itemId?.name || "Item"}
                            {it.size ? ` (${it.size})` : ""}
                            {itBilled > 0 ? (
                              <strong className="ml-1 text-amber-700 dark:text-amber-400">
                                ×{itPending} pending <span className="text-[10px] font-normal text-gray-500">({itBilled}/{itOrdered} billed)</span>
                              </strong>
                            ) : (
                              <strong className="ml-1 text-indigo-600 dark:text-indigo-400">
                                ×{itOrdered}
                              </strong>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom details & single action */}
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {order.salesman?.name ? `Salesman: ${order.salesman.name}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLoadSingle(order);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Load This Order Only</span>
                      <FiArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ModalBody>

      <ModalFooter className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div>
          {selectedOrderIds.length > 0 ? (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Selected: <strong className="text-indigo-600 dark:text-indigo-400">{selectedOrderIds.length}</strong> order(s) | Total: <strong className="text-emerald-600 dark:text-emerald-400">₹{totalSelectedAmount.toFixed(2)}</strong> ({totalSelectedItems} items)
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              Please select at least 1 order to load, or skip.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            layout="outline"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            Skip (Bill Fresh)
          </Button>
          <Button
            onClick={handleConfirmSelected}
            disabled={selectedOrderIds.length === 0}
            className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-button inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <FiLayers className="w-3.5 h-3.5" />
            <span>Load Selected ({selectedOrderIds.length}) into Sale</span>
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CustomerPendingOrdersModal;
