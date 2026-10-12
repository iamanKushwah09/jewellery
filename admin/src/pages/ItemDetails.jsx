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
  FiBox,
  FiTag,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiGlobe,
  FiDollarSign,
  FiRefreshCw,
  FiExternalLink,
} from "react-icons/fi";
import ItemServices from "@/services/ItemServices";
import Loading from "@/components/preloader/Loading";
import PageTitle from "@/components/Typography/PageTitle";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import MainDrawer from "@/components/drawer/MainDrawer";
import ItemDrawer from "@/components/drawer/ItemDrawer";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import AnimatedContent from "@/components/common/AnimatedContent";

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

const ItemDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const { t } = useTranslation();
  const { showDateFormat, currency = "₹" } = useUtilsFunction();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const { title, serviceId, handleUpdate } = useToggleDrawer();

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ItemServices.getItemById(id);
      if (res) {
        setItem(res);
        // Determine initial image
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
      } else {
        setError("Item not found");
      }
    } catch (err) {
      console.error("Error loading item details:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  if (loading) {
    return <Loading loading={loading} />;
  }

  if (error || !item) {
    return (
      <div className="py-12 text-center">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <FiInfo className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Item Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error || "The requested item could not be loaded."}</p>
          <Button
            onClick={() => history.push("/item")}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Items</span>
          </Button>
        </div>
      </div>
    );
  }

  // Collect all images (primary, gallery, and variant images)
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
  if (item.item_attribute?.variant && Array.isArray(item.item_attribute.variant)) {
    item.item_attribute.variant.forEach((v) => {
      if (Array.isArray(v.attribute_image)) {
        v.attribute_image.forEach((ai) => {
          const formatted = formatImageUrl(ai);
          if (formatted && !allImages.includes(formatted)) {
            allImages.push(formatted);
          }
        });
      }
    });
  }

  const variants = item.item_attribute?.variant || item.variant || [];

  return (
    <>
      <MainDrawer product={true}>
        <ItemDrawer id={serviceId || id} />
      </MainDrawer>

      <AnimatedContent>
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => history.push("/item")}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
              title="Back to Items"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Item Details</span>
                {item.alias && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    Alias: {item.alias}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 font-serif leading-tight">
                {item.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => fetchItemDetails()}
              layout="outline"
              className="h-10 px-3.5 rounded-lg border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5 text-xs font-medium"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={() => handleUpdate(item._id)}
              className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-button text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <FiEdit className="w-4 h-4" />
              <span>Edit Item</span>
            </Button>
            <Button
              onClick={() => history.push("/item")}
              layout="outline"
              className="h-10 px-4 rounded-lg border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium"
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* Main Grid: Left is Media/Highlights, Right is Categorization & Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column: Image Preview + Fast Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Image Preview Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              <CardBody className="p-4 sm:p-6">
                <div className="w-full aspect-square bg-gray-50 dark:bg-gray-900/60 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-800 mb-4">
                  <img
                    src={selectedImage || PLACEHOLDER_IMG}
                    alt={item.name}
                    className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PLACEHOLDER_IMG;
                    }}
                  />
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {allImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          selectedImage === imgUrl
                            ? "border-primary shadow-xs scale-105"
                            : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Status Tags */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                  {item.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                      <FiXCircle className="w-3.5 h-3.5 text-red-600" />
                      Inactive
                    </span>
                  )}

                  {item.showOnWebsite !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                      <FiGlobe className="w-3.5 h-3.5 text-blue-600" />
                      Visible on Website
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      Hidden from Store
                    </span>
                  )}

                  {item.gmc?.synced ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      GMC: Synced
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      GMC: {item.gmc?.status || "Pending"}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Pricing & Stock Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
              <CardBody className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-primary" />
                  <span>Pricing & Inventory</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium block">Sale Price</span>
                    <span className="text-xl font-bold text-purple-900 dark:text-purple-100 font-serif">
                      {currency} {Number(item.sale_price || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">MRP</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200 font-serif line-through decoration-gray-400">
                      {currency} {Number(item.mrp || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium block">Current Stock</span>
                    <span className="text-xl font-bold text-emerald-800 dark:text-emerald-100 font-serif">
                      {Number(item.stock || 0).toLocaleString()} <span className="text-xs font-normal text-emerald-600">{item.unit_id?.name || item.unit || "Units"}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium block">GST Rate</span>
                    <span className="text-xl font-bold text-blue-900 dark:text-blue-100 font-serif">
                      {item.tax_gst ? `${item.tax_gst}%` : "N/A"}
                    </span>
                  </div>
                </div>

                {(item.discount || item.vendor_discount) && (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Standard Discount:</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{item.discount || 0}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Vendor Discount:</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{item.vendor_discount || 0}%</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Detailed Specifications & Classifications */}
          <div className="lg:col-span-8 space-y-6">
            {/* General & Classification Information Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
              <CardBody className="p-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <FiLayers className="w-4 h-4 text-primary" />
                  <span>General & Classification Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Item Name</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Print Name</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.print_name || item.name || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alias / Code</span>
                    <p className="font-semibold font-mono text-gray-800 dark:text-gray-100">{item.alias || item.item_code || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Category</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {item.category_id?.name || item.category || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Item Group</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {item.item_group_id?.name || item.itemGroup || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Brand</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {item.brand_id?.name || item.brand || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">HSN Code</span>
                    <p className="font-semibold font-mono text-gray-800 dark:text-gray-100">{item.hsn_code || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Primary Unit</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.unit_id?.name || item.unit || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alternate Unit</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.alternate_unit || "—"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Conversion Factor</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.conversion_factor || 1}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Application Type</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{item.application_type || "Standard"}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Created Date</span>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {item.created_date ? showDateFormat(item.created_date) : "—"}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Descriptions & Specifications Card */}
            {(item.short_description || item.long_description || item.specification) && (
              <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
                <CardBody className="p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                    <FiTag className="w-4 h-4 text-primary" />
                    <span>Descriptions & Specifications</span>
                  </h3>

                  {item.specification && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Specification</span>
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line border border-gray-100 dark:border-gray-800">
                        {item.specification}
                      </div>
                    </div>
                  )}

                  {item.short_description && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Short Description</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.short_description}</p>
                    </div>
                  )}

                  {item.long_description && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Full Description</span>
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.long_description }}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Marketplace Integrations (GMC, Flipkart, Amazon) */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl">
              <CardBody className="p-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4 text-primary" />
                  <span>Marketplace & Channel Sync Status</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* GMC Card */}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-200">Google Merchant (GMC)</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          item.gmc?.synced
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : item.gmc?.status === "FAILED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        {item.gmc?.status || "PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Offer ID: {item.gmc?.offerId || "—"}</p>
                    {item.gmc?.lastSyncedAt && (
                      <p className="text-[11px] text-gray-400 mt-1">Last Sync: {showDateFormat(item.gmc.lastSyncedAt)}</p>
                    )}
                    {item.gmc?.lastError && (
                      <p className="text-[11px] text-red-500 mt-1 truncate" title={item.gmc.lastError}>
                        Error: {item.gmc.lastError}
                      </p>
                    )}
                  </div>

                  {/* Flipkart Card */}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-200">Flipkart</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {item.flipkart?.status || "UNMAPPED"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.flipkart?.sku || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">FSN: {item.flipkart?.fsn || "—"}</p>
                  </div>

                  {/* Amazon Card */}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-200">Amazon</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {item.amazon?.status || "UNMAPPED"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ASIN: {item.amazon?.asin || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.amazon?.sku || "—"}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Variants & Combinations Section */}
        {variants && variants.length > 0 && (
          <Card className="shadow-xs border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-10">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FiBox className="w-5 h-5 text-primary" />
                    <span>Product Variants ({variants.length})</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Colors, sizes, inventory levels, and prices for each combination
                  </p>
                </div>
              </div>

              <TableContainer className="rounded-xl border border-gray-100 dark:border-gray-700/60">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>Variant Image</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>List Price</TableCell>
                      <TableCell>Selling Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v, i) => {
                      const vImg = Array.isArray(v.attribute_image) && v.attribute_image[0]
                        ? formatImageUrl(v.attribute_image[0])
                        : null;
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            {vImg ? (
                              <img
                                src={vImg}
                                alt={`Variant ${i + 1}`}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                                onClick={() => setSelectedImage(vImg)}
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
                            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
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
                          <TableCell>
                            {Number(v.stock || 0) > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                In Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                Out of Stock
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}
      </AnimatedContent>
    </>
  );
};

export default ItemDetails;
