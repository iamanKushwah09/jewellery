import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Badge,
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableFooter,
  Pagination,
} from "@windmill/react-ui";
import {
  FiRefreshCw,
  FiSettings,
  FiShoppingBag,
  FiPlay,
  FiUploadCloud,
  FiSearch,
  FiCheck,
  FiLayers,
  FiBox,
} from "react-icons/fi";
import { SiFlipkart } from "react-icons/si";
import FlipkartServices from "@/services/FlipkartServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import PageTitle from "@/components/Typography/PageTitle";
import dayjs from "dayjs";

// Safe Helper to extract product name/title
const getProductTitle = (p) => {
  if (!p) return "Product";
  if (typeof p.title === "string") return p.title;
  if (p.title?.en) return p.title.en;
  if (p.title?.name) return p.title.name;
  if (typeof p.name === "string") return p.name;
  if (p.name?.en) return p.name.en;
  return "Product";
};

// Safe Helper to extract product image
const getProductImage = (p) => {
  if (!p) return "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";
  if (Array.isArray(p.image) && p.image.length > 0 && typeof p.image[0] === "string") return p.image[0];
  if (typeof p.image === "string" && p.image.length > 0) return p.image;
  return "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";
};

const FlipkartSync = () => {
  const [activeTab, setActiveTab] = useState("products"); // 'products' | 'orders' | 'settings'
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pushingStock, setPushingStock] = useState(false);
  const [testing, setTesting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [autoMapping, setAutoMapping] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  // Settings State
  const [settings, setSettings] = useState({
    isEnabled: false,
    mode: "simulation",
    appId: "",
    appSecret: "",
    sellerId: "",
    locationId: "",
    autoSyncOrders: true,
    autoSyncStock: true,
    syncIntervalMinutes: 15,
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Products Mapping State
  const [products, setProducts] = useState([]);
  const [productsPage, setProductsPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productFilter, setProductFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productStats, setProductStats] = useState({ totalProducts: 0, totalMapped: 0, totalUnmapped: 0 });
  const [editingMapping, setEditingMapping] = useState({});

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedProductForUpload, setSelectedProductForUpload] = useState(null);
  const [uploadForm, setUploadForm] = useState({ sku: "", price: 0, stock: 0 });

  // Simulation Form
  const [simProductId, setSimProductId] = useState("");
  const [simQuantity, setSimQuantity] = useState(1);
  const [simBuyerName, setSimBuyerName] = useState("Amit Kumar");
  const [simCity, setSimCity] = useState("New Delhi");

  // Load Settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await FlipkartServices.getSettings();
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          ...res.settings,
          appSecret: "",
        }));
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to load Flipkart settings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async (page = 1) => {
    try {
      const res = await FlipkartServices.getOrders({ page, limit: 15 });
      if (res.success) {
        setOrders(res.orders || []);
        setTotalOrders(res.totalDoc || 0);
        setOrdersPage(page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Products
  const fetchProducts = async (page = 1) => {
    try {
      const res = await FlipkartServices.getMappedProducts({
        page,
        limit: 10,
        search: productSearch,
        filter: productFilter,
      });
      if (res.success) {
        setProducts(res.products || []);
        setTotalProducts(res.totalDoc || 0);
        setProductStats(res.stats || { totalProducts: 0, totalMapped: 0, totalUnmapped: 0 });
        setProductsPage(page);

        const initialEdit = {};
        (res.products || []).forEach((p) => {
          initialEdit[p._id] = {
            flipkartSku: p.flipkartSku || "",
            fsn: p.fsn || "",
            flipkartSyncEnabled: p.flipkartSyncEnabled ?? true,
          };
        });
        setEditingMapping(initialEdit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "products") fetchProducts(productsPage);
    if (activeTab === "orders") fetchOrders(ordersPage);
  }, [activeTab, productsPage, productFilter]);

  // Master switch toggle
  const handleToggleMaster = async () => {
    const newState = !settings.isEnabled;
    try {
      const res = await FlipkartServices.updateSettings({ isEnabled: newState });
      if (res.success) {
        setSettings((prev) => ({ ...prev, isEnabled: newState }));
        notifySuccess(`Flipkart Sync turned ${newState ? "ON" : "OFF"}`);
      }
    } catch (err) {
      notifyError("Failed to update status");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await FlipkartServices.updateSettings(settings);
      if (res.success) {
        notifySuccess("Settings saved successfully!");
        fetchSettings();
      }
    } catch (err) {
      notifyError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // Sync Orders Now
  const handleSyncOrders = async () => {
    try {
      setSyncing(true);
      const res = await FlipkartServices.syncOrders();
      if (res.success) {
        notifySuccess(res.message || "Orders synced successfully!");
        if (activeTab === "orders") fetchOrders(1);
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Push All Stock
  const handlePushStock = async () => {
    try {
      setPushingStock(true);
      const res = await FlipkartServices.syncInventory();
      if (res.success) {
        notifySuccess(res.message || "Stock pushed to Flipkart!");
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Stock push failed");
    } finally {
      setPushingStock(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const res = await FlipkartServices.testConnection();
      if (res.success) {
        notifySuccess(res.message || "Connection successful!");
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  // Simulate purchase
  const handleSimulateOrder = async () => {
    try {
      setSimulating(true);
      const res = await FlipkartServices.simulateOrder({
        productId: simProductId || undefined,
        quantity: simQuantity,
        buyerName: simBuyerName,
        city: simCity,
      });
      if (res.success) {
        notifySuccess(res.message || "Simulated purchase successful!");
        if (activeTab === "orders") fetchOrders(1);
        if (activeTab === "products") fetchProducts(productsPage);
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  // Save single product mapping
  const handleSaveProductMapping = async (productId) => {
    const data = editingMapping[productId];
    if (!data) return;
    try {
      const res = await FlipkartServices.updateProductMapping({
        productId,
        flipkartSku: data.flipkartSku,
        fsn: data.fsn,
        flipkartSyncEnabled: data.flipkartSyncEnabled,
      });
      if (res.success) {
        notifySuccess(res.message || "Product mapping saved!");
        fetchProducts(productsPage);
      }
    } catch (err) {
      notifyError("Failed to update product mapping");
    }
  };

  // Open Upload confirmation modal
  const openUploadModal = (product) => {
    if (!product) return;
    const edit = editingMapping[product._id] || {};
    setSelectedProductForUpload(product);
    setUploadForm({
      sku: edit.flipkartSku || product.flipkartSku || product.sku || product.item_code || `FK-${product._id ? product._id.slice(-6).toUpperCase() : "ITEM"}`,
      price: product.prices?.price ?? product.prices?.originalPrice ?? product.sale_price ?? product.price ?? 0,
      stock: product.stock ?? product.quantity ?? 0,
    });
    setUploadModalOpen(true);
  };

  // Upload single product listing to Flipkart
  const handleConfirmUpload = async () => {
    if (!selectedProductForUpload) return;
    try {
      setUploadingId(selectedProductForUpload._id);
      await FlipkartServices.updateProductMapping({
        productId: selectedProductForUpload._id,
        flipkartSku: uploadForm.sku,
      });

      const res = await FlipkartServices.uploadProduct(selectedProductForUpload._id);
      if (res.success) {
        notifySuccess(res.message || "Product listing uploaded to Flipkart!");
        setUploadModalOpen(false);
        fetchProducts(productsPage);
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to push listing to Flipkart");
    } finally {
      setUploadingId(null);
    }
  };

  // Auto-map all products in 1-click
  const handleAutoMap = async () => {
    try {
      setAutoMapping(true);
      const res = await FlipkartServices.autoMapAll();
      if (res.success) {
        notifySuccess(res.message || "All products auto-mapped!");
        fetchProducts(1);
      }
    } catch (err) {
      notifyError("Failed to auto-map products");
    } finally {
      setAutoMapping(false);
    }
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <PageTitle breadcrumb="Flipkart Sync">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-yellow-400 text-blue-900 rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                <SiFlipkart />
              </span>
              <span>Flipkart Synchronization</span>
            </div>
          </PageTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            2-Way Real-Time Product Listing, Stock Push & Automated Order Sync Engine.
          </p>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <span className="block text-xs font-bold text-gray-900 dark:text-white">
              Master Sync Switch
            </span>
            <span className={`text-[11px] font-semibold ${settings.isEnabled ? "text-emerald-500 dark:text-emerald-400" : "text-gray-400"}`}>
              {settings.isEnabled ? "Active & Syncing" : "Disabled"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleMaster}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
              settings.isEnabled ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.isEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stroke mb-6 gap-2">
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-body hover:text-black"
          }`}
        >
          <FiUploadCloud className="w-4 h-4" />
          Product & Listing Upload ({productStats.totalProducts || products.length})
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-body hover:text-black"
          }`}
        >
          <FiShoppingBag className="w-4 h-4" />
          Flipkart Orders
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-body hover:text-black"
          }`}
        >
          <FiSettings className="w-4 h-4" />
          API & Sync Settings
        </button>
      </div>

      {/* Tab 1: Product & Listing Upload */}
      {activeTab === "products" && (
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <CardBody>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search product by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchProducts(1)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => fetchProducts(1)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-200"
                >
                  Search
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoMap}
                  disabled={autoMapping}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-button flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  <FiLayers className="w-3.5 h-3.5" />
                  {autoMapping ? "Mapping..." : "Auto-Map All SKUs (1-Click)"}
                </button>
                <button
                  onClick={handlePushStock}
                  disabled={pushingStock}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${pushingStock ? "animate-spin" : ""}`} />
                  {pushingStock ? "Pushing..." : "Push All Stock to Flipkart"}
                </button>
              </div>
            </div>

            {/* Products Table */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <FiBox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No products found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Product Item</TableCell>
                      <TableCell>Store SKU</TableCell>
                      <TableCell>Flipkart Seller SKU</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell className="text-right">Action</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => {
                      const edit = editingMapping[p._id] || { flipkartSku: p.flipkartSku || "", fsn: p.fsn || "" };
                      const isMapped = !!p.flipkartSku || !!p.fsn;

                      return (
                        <TableRow key={p._id}>
                          {/* Image & Title */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={getProductImage(p)}
                                alt={getProductTitle(p)}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="max-w-[220px]">
                                <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate">
                                  {getProductTitle(p)}
                                </p>
                                <span className="text-[10px] text-gray-400">ID: {p._id.slice(-6)}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Store SKU */}
                          <TableCell>
                            <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                              {p.sku || p.item_code || "N/A"}
                            </span>
                          </TableCell>

                          {/* Flipkart SKU */}
                          <TableCell>
                            <input
                              type="text"
                              value={edit.flipkartSku}
                              onChange={(e) =>
                                setEditingMapping({
                                  ...editingMapping,
                                  [p._id]: { ...edit, flipkartSku: e.target.value },
                                })
                              }
                              className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 w-36"
                              placeholder="e.g. FK-SKU-001"
                            />
                          </TableCell>

                          {/* Price */}
                          <TableCell>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                              ₹{p.prices?.price ?? p.sale_price ?? 0}
                            </span>
                          </TableCell>

                          {/* Stock */}
                          <TableCell>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                (p.stock ?? 0) > 0
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                                  : "bg-red-50 text-red-600 dark:bg-red-950/40"
                              }`}
                            >
                              {p.stock ?? 0} units
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge type={isMapped ? "success" : "warning"}>
                              {isMapped ? "MAPPED" : "UNMAPPED"}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveProductMapping(p._id)}
                                title="Save SKU"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openUploadModal(p)}
                                disabled={uploadingId === p._id}
                                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiUploadCloud className={`w-3.5 h-3.5 ${uploadingId === p._id ? "animate-bounce" : ""}`} />
                                {uploadingId === p._id ? "Pushing..." : "Push Listing"}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalProducts > 10 && (
                  <TableFooter>
                    <Pagination
                      totalResults={totalProducts}
                      resultsPerPage={10}
                      onChange={(p) => setProductsPage(p)}
                      label="Products navigation"
                    />
                  </TableFooter>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 2: Flipkart Synced Orders */}
      {activeTab === "orders" && (
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FiShoppingBag className="w-4 h-4 text-blue-600" />
                Flipkart Synced Orders
              </h3>
              <div className="flex items-center gap-2">
                <Button size="small" onClick={handleSyncOrders} disabled={syncing}>
                  <FiRefreshCw className={`w-3.5 h-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
                  Sync Orders Now
                </Button>
                <Button size="small" layout="outline" onClick={() => fetchOrders(ordersPage)}>
                  Refresh
                </Button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No Flipkart orders imported yet.</p>
                <button
                  onClick={handleSimulateOrder}
                  className="mt-3 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-button transition-all"
                >
                  Create Simulated Test Order
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Flipkart Order ID</TableCell>
                      <TableCell>Customer / Buyer</TableCell>
                      <TableCell>Purchased Items</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Order Status</TableCell>
                      <TableCell>Imported At</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o._id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {o.flipkartOrderId || `FK-${o._id.slice(-6)}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {o.user_info?.name || "Flipkart Customer"}
                          </span>
                          <span className="block text-[10px] text-gray-400">{o.user_info?.contact}</span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {o.cart?.map((c, i) => (
                              <p key={i} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {c.title?.en || c.title || "Item"} × <span className="font-bold">{c.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            ₹{o.total || o.grandTotal || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge type={o.status === "Delivered" ? "success" : "primary"}>
                            {o.flipkartOrderStatus || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {dayjs(o.createdAt).format("DD MMM, hh:mm A")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalOrders > 15 && (
                  <TableFooter>
                    <Pagination
                      totalResults={totalOrders}
                      resultsPerPage={15}
                      onChange={(p) => setOrdersPage(p)}
                      label="Orders pagination"
                    />
                  </TableFooter>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 3: Settings & API Configuration */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="md:col-span-2">
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
              <CardBody>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 pb-2 border-b">
                    Flipkart Seller API Configuration
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Integration Mode
                      </label>
                      <select
                        value={settings.mode}
                        onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="simulation">Simulation Mode (Default / Testing)</option>
                        <option value="production">Production Mode (Live Flipkart API)</option>
                        <option value="sandbox">Sandbox Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Auto-Sync Interval
                      </label>
                      <select
                        value={settings.syncIntervalMinutes}
                        onChange={(e) => setSettings({ ...settings, syncIntervalMinutes: Number(e.target.value) })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value={5}>Every 5 minutes</option>
                        <option value={15}>Every 15 minutes (Recommended)</option>
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every 1 hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Flipkart App ID (Client ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FK_APP_123456"
                        value={settings.appId}
                        onChange={(e) => setSettings({ ...settings, appId: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Flipkart App Secret
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={settings.appSecret}
                        onChange={(e) => setSettings({ ...settings, appSecret: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Seller ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SELLER_XYZ"
                        value={settings.sellerId}
                        onChange={(e) => setSettings({ ...settings, sellerId: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Location ID (Pickup Hub)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. LOC_123"
                        value={settings.locationId}
                        onChange={(e) => setSettings({ ...settings, locationId: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg"
                    >
                      {testing ? "Testing..." : "Test Connection"}
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-button transition-all"
                    >
                      {loading ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Quick Simulation Box */}
          <div>
            <Card className="shadow-sm border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
              <CardBody className="space-y-3">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <FiPlay className="w-4 h-4 text-amber-600" />
                  Instant Test Purchase
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Simulate a Flipkart purchase to verify auto stock deduction & Sale Order creation.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Select Product
                  </label>
                  <select
                    value={simProductId}
                    onChange={(e) => setSimProductId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Auto-select first item</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {getProductTitle(p)} (Stock: {p.stock ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={simQuantity}
                      onChange={(e) => setSimQuantity(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Customer
                    </label>
                    <input
                      type="text"
                      value={simBuyerName}
                      onChange={(e) => setSimBuyerName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateOrder}
                  disabled={simulating}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FiShoppingBag className="w-3.5 h-3.5" />
                  {simulating ? "Processing..." : "Simulate Purchase Now"}
                </button>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Push Listing to Flipkart */}
      {uploadModalOpen && selectedProductForUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-blue-900 dark:text-yellow-400">
                <FiUploadCloud className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-sm">Push Listing to Flipkart Marketplace</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <img
                  src={getProductImage(selectedProductForUpload)}
                  alt={getProductTitle(selectedProductForUpload)}
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                    {getProductTitle(selectedProductForUpload)}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Current Stock: <span className="font-semibold text-emerald-600">{selectedProductForUpload.stock ?? 0} units</span> | Price: <span className="font-semibold">₹{selectedProductForUpload.prices?.price ?? selectedProductForUpload.sale_price ?? 0}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Flipkart Seller SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.sku}
                    onChange={(e) => setUploadForm({ ...uploadForm, sku: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. FK-SKU-1001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      value={uploadForm.price}
                      onChange={(e) => setUploadForm({ ...uploadForm, price: Number(e.target.value) })}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Available Stock (Units)
                    </label>
                    <input
                      type="number"
                      value={uploadForm.stock}
                      onChange={(e) => setUploadForm({ ...uploadForm, stock: Number(e.target.value) })}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploadingId === selectedProductForUpload?._id || !uploadForm.sku}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <FiUploadCloud className={`w-4 h-4 ${uploadingId === selectedProductForUpload?._id ? "animate-bounce" : ""}`} />
                {uploadingId === selectedProductForUpload?._id ? "Uploading..." : "Confirm & Push to Flipkart 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlipkartSync;
