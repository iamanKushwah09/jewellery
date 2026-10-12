import React, { useState, useEffect, useContext } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Input, Button } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiBox } from "react-icons/fi";

// Internal imports
import Title from "@/components/form/others/Title";
import { SidebarContext } from "@/context/SidebarContext";
import ItemServices from "@/services/ItemServices";
import Loading from "@/components/preloader/Loading";
import { notifyError, notifySuccess } from "@/utils/toast";

const StockDrawer = ({ id, onStockUpdated }) => {
  const { t } = useTranslation();
  const { closeDrawer, setIsUpdate } = useContext(SidebarContext);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (!id) {
      setItem(null);
      setStock("");
      return;
    }

    let isMounted = true;
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const res = await ItemServices.getItemById(id);
        if (!isMounted) return;
        if (res) {
          setItem(res);
          // Input field is always empty when opened so user can enter quantity to add
          setStock("");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching item for StockDrawer:", err);
        notifyError(err.response?.data?.message || err.message || "Failed to load item details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchItemDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!id || !item) return;

    const addQty = Number(stock);
    if (isNaN(addQty) || stock.toString().trim() === "") {
      notifyError(t("Please enter stock quantity"));
      return;
    }

    try {
      setIsSubmitting(true);

      const prevStock = Number(item.stock) || 0;
      // Add entered quantity to previous stock
      const newStock = prevStock + addQty;

      let payload = {
        stock: newStock,
        source_code: 2,
        source_name: "Stock",
        notes: `Added ${addQty} to stock (Previous: ${prevStock}, Current: ${newStock})`,
      };

      // Also update variant stocks if item has variants
      if (Array.isArray(item.item_attribute?.variant) && item.item_attribute.variant.length > 0) {
        payload.item_attribute = {
          ...(item.item_attribute || {}),
          variant: item.item_attribute.variant.map((v) => ({
            ...v,
            stock: (Number(v.stock) || 0) + addQty,
          })),
        };
      }

      await ItemServices.updateItem(id, payload);
      notifySuccess(t("Stock updated successfully!"));
      setIsSubmitting(false);
      setStock("");
      if (setIsUpdate) setIsUpdate(true);
      if (onStockUpdated) onStockUpdated();
      closeDrawer();
    } catch (err) {
      console.error("Error updating stock:", err);
      const errMsg =
        err.response?.data?.message || err.message || "Failed to update stock";
      notifyError(errMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Title title={t("Update Stock")} />
      </div>

      {/* Drawer Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <Loading loading={loading} />
        </div>
      ) : !item ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <FiBox className="w-12 h-12 mb-3 text-gray-400 stroke-1" />
          <p className="text-base font-medium">
            {t("Please select an item from the stock list to update.")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleStockSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Scrollbars
            style={{ height: "calc(100vh - 160px)" }}
            className="w-full flex-1 relative dark:bg-gray-700 dark:text-gray-200"
          >
            <div className="p-6">
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <label className="block text-gray-700 dark:text-gray-400 font-semibold text-sm leading-none mb-2">
                  {t("Stock")} <span className="text-red-500">*</span>
                </label>
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    type="number"
                    name="stock"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder={t("Stock")}
                    className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                    autoFocus
                    required
                  />
                </div>
              </div>
            </div>
          </Scrollbars>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 w-full right-0 py-4 px-6 md:py-6 flex justify-end gap-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <Button
              layout="outline"
              onClick={closeDrawer}
              type="button"
              className="w-full sm:w-auto h-12 px-6 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 font-medium rounded-lg"
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 px-8 rounded-lg font-medium bg-[#0e9f6e] hover:bg-[#046c4e] text-white"
            >
              {isSubmitting ? t("Processing") : t("Update Stock")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StockDrawer;
