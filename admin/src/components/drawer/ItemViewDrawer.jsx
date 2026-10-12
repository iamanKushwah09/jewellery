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
  FiBox,
  FiTag,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiGlobe,
  FiDollarSign,
  FiInfo,
} from "react-icons/fi";
import ItemServices from "@/services/ItemServices";
import Loading from "@/components/preloader/Loading";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { SidebarContext } from "@/context/SidebarContext";
import ActiveButton from "@/components/form/button/ActiveButton";

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

const ViewField = ({ label, value, required = false, isMono = false, isCurrency = false, currency = "₹" }) => {
  return (
    <div className="col-span-12 md:col-span-3">
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="w-full min-h-[38px] px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 flex items-center">
        {isCurrency ? (
          <span className="font-semibold text-primary font-serif">
            {currency} {value !== undefined && value !== null && value !== "" ? Number(value).toLocaleString() : "0"}
          </span>
        ) : (
          <span className={`${isMono ? "font-mono font-medium" : "font-medium"} truncate`}>
            {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
          </span>
        )}
      </div>
    </div>
  );
};

const ItemViewDrawer = ({ id, onEdit }) => {
  const { t } = useTranslation();
  const { toggleDrawer } = useContext(SidebarContext);
  const { showDateFormat, currency = "₹" } = useUtilsFunction();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tapValue, setTapValue] = useState("Item Info");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (id) {
      setLoading(true);
      ItemServices.getItemById(id)
        .then((res) => {
          setItem(res);
          let initialImg = "";
          if (res.images && res.images.length > 0) {
            initialImg = formatImageUrl(res.images[0]);
          } else if (res.image) {
            const firstImg = Array.isArray(res.image) ? res.image[0] : res.image;
            initialImg = formatImageUrl(firstImg);
          } else if (res.default_image) {
            initialImg = formatImageUrl(res.default_image);
          }
          setSelectedImage(initialImg || PLACEHOLDER_IMG);
        })
        .catch((err) => {
          console.error("Error fetching item for view drawer:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <Loading loading={loading} />;
  }

  if (!item) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FiInfo className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p>Item not found or could not be loaded.</p>
      </div>
    );
  }

  // Collect all gallery images
  const allImages = [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    item.images.forEach((img) => allImages.push(formatImageUrl(img)));
  } else if (Array.isArray(item.image) && item.image.length > 0) {
    item.image.forEach((img) => allImages.push(formatImageUrl(img)));
  } else if (item.image) {
    allImages.push(formatImageUrl(item.image));
  }
  if (item.default_image && !allImages.includes(formatImageUrl(item.default_image))) {
    allImages.push(formatImageUrl(item.default_image));
  }

  const variants = item.item_attribute?.variant || item.variant || [];

  return (
    <>
      {/* Header matching Title */}
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <div className="flex md:flex-row flex-col justify-between items-start md:items-center mr-20 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-semibold text-primary">View Mode</span>
              {item.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <FiCheckCircle className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  <FiXCircle className="w-3 h-3" /> Inactive
                </span>
              )}
              {item.showOnWebsite !== false ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  Visible in Store
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  Hidden
                </span>
              )}
            </div>
            <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-serif">
              {item.name}
            </h4>
          </div>

          {onEdit && (
            <Button
              onClick={onEdit}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FiEdit className="w-3.5 h-3.5" />
              <span>Edit Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs navigation identical to edit window */}
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <ActiveButton
              tapValue={tapValue}
              activeValue="Item Info"
              handleProductTap={() => setTapValue("Item Info")}
            />
          </li>

          <li className="mr-2">
            <ActiveButton
              tapValue={tapValue}
              activeValue="Item Attribute"
              handleProductTap={() => setTapValue("Item Attribute")}
            />
          </li>
        </ul>
      </div>

      {/* Body with Scrollbars */}
      <Scrollbars className="w-full relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody>
            {tapValue === "Item Info" ? (
              <div className="px-6 flex-grow scrollbar-hide w-full max-h-full pb-32">
                {/* Row 1 */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-3">
                  <ViewField label="Name" value={item.name} required />
                  <ViewField label="Alias" value={item.alias} isMono />
                  <ViewField label="Category" value={item.category_id?.name || item.category} />
                  <ViewField label="Item group" value={item.item_group_id?.name || item.itemGroup} />
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-3">
                  <ViewField label="Brand" value={item.brand_id?.name || item.brand} />
                  <ViewField label="Unit" value={item.unit_id?.name || item.unit} required />
                  <ViewField label="Alternate unit" value={item.alternate_unit} />
                  <ViewField label="Conversion factor" value={item.conversion_factor} />
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-3">
                  <ViewField label="Tax GST" value={item.tax_gst ? `${item.tax_gst}%` : ""} />
                  <ViewField label="HSN Code" value={item.hsn_code} isMono />
                  <ViewField label="Sale Price" value={item.sale_price} isCurrency currency={currency} />
                  <ViewField label="MRP" value={item.mrp} isCurrency currency={currency} />
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-3">
                  <ViewField label="Stock" value={item.stock} />
                  <ViewField label="Discount (%)" value={item.discount} />
                  <ViewField label="Vendor Discount (%)" value={item.vendor_discount} />
                  <ViewField label="Short description" value={item.short_description} />
                </div>

                {/* Row 5: Specification & Long description */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-4">
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Specification
                    </label>
                    <div className="w-full min-h-[90px] p-3 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 whitespace-pre-line">
                      {item.specification || "—"}
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Long description
                    </label>
                    <div className="w-full min-h-[90px] p-3 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 leading-relaxed overflow-y-auto max-h-[150px]">
                      {item.long_description ? (
                        <div dangerouslySetInnerHTML={{ __html: item.long_description }} />
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 6: Image Gallery */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-4 mb-3">
                  <div className="col-span-12">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Product Images
                    </label>
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={selectedImage || PLACEHOLDER_IMG}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                      </div>

                      {allImages.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {allImages.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt={`Thumb ${i}`}
                              onClick={() => setSelectedImage(imgUrl)}
                              className={`w-14 h-14 object-cover rounded-lg border-2 cursor-pointer transition-all ${
                                selectedImage === imgUrl ? "border-primary shadow-xs" : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Item Attribute Tab */
              <div className="px-6 flex-grow scrollbar-hide w-full max-h-full pb-32 space-y-5">
                {/* GST Settings */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 sm:col-span-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Including GST ?</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                        {item.item_attribute?.gst_check || "No"}
                      </span>
                    </div>
                    <div className="col-span-12 sm:col-span-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Offer / Scheme</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {item.item_attribute?.offer || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variants Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <FiBox className="w-4 h-4 text-primary" />
                      Variants ({variants.length})
                    </h5>
                  </div>

                  {variants.length > 0 ? (
                    <TableContainer className="rounded-xl border border-gray-200 dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <tr>
                            <TableCell>Image</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Selling Price</TableCell>
                            <TableCell>Stock</TableCell>
                          </tr>
                        </TableHeader>
                        <TableBody>
                          {variants.map((v, idx) => {
                            const vImg = Array.isArray(v.attribute_image) && v.attribute_image[0]
                              ? formatImageUrl(v.attribute_image[0])
                              : null;
                            return (
                              <TableRow key={idx}>
                                <TableCell>
                                  {vImg ? (
                                    <img
                                      src={vImg}
                                      alt="Variant"
                                      className="w-9 h-9 object-cover rounded border border-gray-200 dark:border-gray-700"
                                    />
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                                    {v.color || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    {v.size || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-gray-600 dark:text-gray-400 font-serif">
                                    {currency} {Number(v.price || 0).toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-serif">
                                    {currency} {Number(v.selling_price || v.price || 0).toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                    {v.stock || 0}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-500 rounded-lg">
                      No specific variants configured for this item.
                    </div>
                  )}
                </div>

                {/* Marketplace Sync */}
                <div className="pt-2">
                  <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                    <FiGlobe className="w-4 h-4 text-primary" />
                    Marketplace & Channels
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span>GMC Sync</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                          {item.gmc?.status || "PENDING"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">Offer: {item.gmc?.offerId || "—"}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span>Flipkart</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {item.flipkart?.status || "UNMAPPED"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">SKU: {item.flipkart?.sku || "—"}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span>Amazon</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {item.amazon?.status || "UNMAPPED"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">ASIN: {item.amazon?.asin || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {onEdit && (
          <Button
            onClick={onEdit}
            className="h-10 px-6 rounded-lg font-medium bg-[#845adf] hover:bg-[#7248cf] text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FiEdit className="w-4 h-4" />
            <span>Edit Item</span>
          </Button>
        )}
      </div>
    </>
  );
};

export default ItemViewDrawer;
