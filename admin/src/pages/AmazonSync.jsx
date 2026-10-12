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
import { FaAmazon } from "react-icons/fa";
import AmazonServices from "@/services/AmazonServices";
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

const AmazonSync = () => {
  const [activeTab, setActiveTab] = useState("products");
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
    lwaClientId: "",
    lwaClientSecret: "",
    refreshToken: "",
    sellerId: "",
    marketplaceId: "A21TJRUUN4KGV",
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

  // Logs State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [editingSku, setEditingSku] = useState({});

  // ==========================================
  // Data Fetching
  // ==========================================
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await AmazonServices.getSettings();
      if (res?.settings) {
        setSettings({
          ...res.settings,
          lwaClientSecret: res.settings.lwaClientSecretMasked || "",
          refreshToken: res.settings.refreshTokenMasked || "",
        });
      }
      if (res?.stats) setStats(res.stats);
      if (res?.recentLogs) setLogs(res.recentLogs);
    } catch (err) {
      notifyError(err?.response?.data?.message || err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page = 1) => {
    try {
      const res = await AmazonServices.getOrders({ page, limit: 20 });
      if (res?.orders) setOrders(res.orders);
      if (res?.totalDoc !== undefined) setTotalOrders(res.totalDoc);
    } catch (err) {
      notifyError("Failed to load Amazon orders");
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      const res = await AmazonServices.getMappedProducts({
        page,
        limit: 10,
        search: productSearch,
        filter: productFilter,
      });
      if (res?.products) setProducts(res.products);
      if (res?.totalDoc !== undefined) setTotalProducts(res.totalDoc);
      if (res?.stats) setProductStats(res.stats);
    } catch (err) {
      notifyError("Failed to load products");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts(productsPage);
  }, [productsPage, productFilter]);

  // ==========================================
  // Action Handlers
  // ==========================================
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await AmazonServices.updateSettings(settings);
      notifySuccess("Amazon settings saved successfully!");
      fetchSettings();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const res = await AmazonServices.testConnection();
      if (res?.success) {
        notifySuccess(res.message || "Connection successful!");
      } else {
        notifyError(res?.message || "Connection test failed");
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncOrders = async () => {
    try {
      setSyncing(true);
      const res = await AmazonServices.syncOrders();
      notifySuccess(res?.message || "Orders synchronized!");
      fetchSettings();
      fetchOrders();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handlePushStock = async () => {
    try {
      setPushingStock(true);
      const res = await AmazonServices.syncInventory();
      notifySuccess(res?.message || "Inventory pushed!");
      fetchSettings();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Inventory push failed");
    } finally {
      setPushingStock(false);
    }
  };

  const handleSimulateOrder = async () => {
    try {
      setSimulating(true);
      const res = await AmazonServices.simulateOrder({});
      notifySuccess(res?.message || "Simulated order created!");
      fetchSettings();
      fetchOrders();
      fetchProducts();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const handleAutoMap = async () => {
    try {
      setAutoMapping(true);
      const res = await AmazonServices.autoMapAll();
      notifySuccess(res?.message || "Auto-mapped successfully!");
      fetchProducts(productsPage);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Auto-map failed");
    } finally {
      setAutoMapping(false);
    }
  };

  const handleUploadProduct = async (productId) => {
    try {
      setUploadingId(productId);
      const res = await AmazonServices.uploadProduct(productId);
      notifySuccess(res?.message || "Product pushed to Amazon!");
      fetchProducts(productsPage);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveMapping = async (productId) => {
    try {
      const mapping = editingSku[productId] || {};
      await AmazonServices.updateProductMapping({
        productId,
        amazonSku: mapping.sku,
        asin: mapping.asin,
      });
      notifySuccess("Mapping saved!");
      setEditingSku((prev) => {
        const n = { ...prev };
        delete n[productId];
        return n;
      });
      fetchProducts(productsPage);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to save mapping");
    }
  };

  // ==========================================
  // Render Tabs
  // ==========================================

  const tabButtonClass = (tab) =>
    `px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      activeTab === tab
        ? "bg-primary text-white shadow-button"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60"
    }`;

  // ==========================================
  // Products Tab
  // ==========================================
  const renderProductsTab = () => (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Products</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{productStats.totalProducts || 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mapped to Amazon</div>
          <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">{productStats.totalMapped || 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unmapped</div>
          <div className="text-2xl font-bold text-rose-500 dark:text-rose-400 mt-1">{productStats.totalUnmapped || 0}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, ASIN..."
            className="w-full h-10 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-primary transition"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProducts(1)}
          />
        </div>
        <select
          className="h-10 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-primary transition"
          value={productFilter}
          onChange={(e) => { setProductFilter(e.target.value); setProductsPage(1); }}
        >
          <option value="all">All Products</option>
          <option value="mapped">Mapped Only</option>
          <option value="unmapped">Unmapped Only</option>
        </select>
        <Button
          size="small"
          className="h-10 bg-primary hover:bg-primary-hover shadow-button text-white rounded-lg px-4 py-2 font-medium"
          onClick={handleAutoMap}
          disabled={autoMapping}
        >
          <FiLayers className="mr-1.5" /> {autoMapping ? "Mapping..." : "Auto-Map All"}
        </Button>
      </div>

      {/* Products Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableCell>Product</TableCell>
            <TableCell>Local SKU</TableCell>
            <TableCell>Amazon SKU</TableCell>
            <TableCell>ASIN</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Actions</TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="text-center py-8 text-gray-400">
                  <FiBox className="mx-auto text-3xl mb-2" />
                  <p>No products found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage(p)}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover border"
                      onError={(e) => { e.target.src = "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png"; }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                      {getProductTitle(p)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500 font-mono">{p.sku || "—"}</span>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs w-28 dark:bg-gray-700 dark:text-gray-200"
                    defaultValue={p.amazonSku || ""}
                    onChange={(e) =>
                      setEditingSku((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], sku: e.target.value },
                      }))
                    }
                    placeholder="Amazon SKU"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs w-28 dark:bg-gray-700 dark:text-gray-200"
                    defaultValue={p.asin || ""}
                    onChange={(e) =>
                      setEditingSku((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], asin: e.target.value },
                      }))
                    }
                    placeholder="ASIN"
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm">{p.stock ?? 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold">₹{p.prices?.price || 0}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingSku[p._id] && (
                      <Button
                        size="small"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleSaveMapping(p._id)}
                      >
                        <FiCheck size={14} />
                      </Button>
                    )}
                    <Button
                      size="small"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => handleUploadProduct(p._id)}
                      disabled={uploadingId === p._id}
                    >
                      <FiUploadCloud size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
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
  );

  // ==========================================
  // Orders Tab
  // ==========================================
  const renderOrdersTab = () => (
    <div>
      <Table>
        <TableHeader>
          <tr>
            <TableCell>Amazon Order ID</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="text-center py-8 text-gray-400">
                  <FiShoppingBag className="mx-auto text-3xl mb-2" />
                  <p>No Amazon orders synced yet. Try "Simulate Order" or "Sync Now" to pull orders.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o._id}>
                <TableCell>
                  <span className="text-xs font-mono text-orange-600 dark:text-orange-400">
                    {o.amazonOrderId || o.flipkartOrderId || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{o.user_info?.name || "—"}</p>
                    <p className="text-xs text-gray-400">{o.user_info?.contact || ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{o.cart?.length || 0} items</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">₹{o.total || o.grandTotal || 0}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    type={
                      o.status === "Delivered" ? "success" :
                      o.status === "Cancel" ? "danger" :
                      o.status === "Processing" ? "warning" : "primary"
                    }
                  >
                    {o.status || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500">{dayjs(o.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {totalOrders > 20 && (
        <TableFooter>
          <Pagination
            totalResults={totalOrders}
            resultsPerPage={20}
            onChange={(p) => { setOrdersPage(p); fetchOrders(p); }}
            label="Orders navigation"
          />
        </TableFooter>
      )}
    </div>
  );

  // ==========================================
  // Settings Tab
  // ==========================================
  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between bg-orange-50 dark:bg-gray-700 rounded-lg p-4 border border-orange-100 dark:border-gray-600">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Amazon Integration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable Amazon SP-API synchronization</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.isEnabled}
            onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
          />
          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardBody>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Environment Mode</h4>
          <div className="flex gap-4">
            {["simulation", "sandbox", "production"].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={settings.mode === m}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                  className="accent-orange-500"
                />
                <span className="text-sm capitalize text-gray-700 dark:text-gray-200">{m}</span>
              </label>
            ))}
          </div>
          {settings.mode === "simulation" && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ⚡ Simulation mode — No real API calls. Test the full flow with simulated orders.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Credentials */}
      <Card>
        <CardBody>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Amazon SP-API Credentials (LWA OAuth2)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">LWA Client ID</label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.lwaClientId || ""}
                onChange={(e) => setSettings({ ...settings, lwaClientId: e.target.value })}
                placeholder="amzn1.application-oa2-client.xxxxx"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">LWA Client Secret</label>
              <input
                type="password"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.lwaClientSecret || ""}
                onChange={(e) => setSettings({ ...settings, lwaClientSecret: e.target.value })}
                placeholder="Enter LWA Client Secret"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Refresh Token</label>
              <input
                type="password"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.refreshToken || ""}
                onChange={(e) => setSettings({ ...settings, refreshToken: e.target.value })}
                placeholder="Atzr|IwEB..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Seller ID</label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.sellerId || ""}
                onChange={(e) => setSettings({ ...settings, sellerId: e.target.value })}
                placeholder="A1XXXXXXXXXXXXX"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Marketplace ID</label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.marketplaceId || "A21TJRUUN4KGV"}
                onChange={(e) => setSettings({ ...settings, marketplaceId: e.target.value })}
                placeholder="A21TJRUUN4KGV (India)"
              />
              <p className="text-xs text-gray-400 mt-1">India: A21TJRUUN4KGV | US: ATVPDKIKX0DER</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sync Configuration */}
      <Card>
        <CardBody>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Sync Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncOrders}
                onChange={(e) => setSettings({ ...settings, autoSyncOrders: e.target.checked })}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">Auto-Sync Orders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncStock}
                onChange={(e) => setSettings({ ...settings, autoSyncStock: e.target.checked })}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">Auto-Sync Stock</span>
            </label>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Sync Interval</label>
              <select
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                value={settings.syncIntervalMinutes}
                onChange={(e) => setSettings({ ...settings, syncIntervalMinutes: Number(e.target.value) })}
              >
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 60 minutes</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status Dashboard */}
      <Card>
        <CardBody>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Sync Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Order Sync</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {stats.lastOrderSyncAt ? dayjs(stats.lastOrderSyncAt).format("DD MMM, hh:mm A") : "Never"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Stock Sync</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {stats.lastStockSyncAt ? dayjs(stats.lastStockSyncAt).format("DD MMM, hh:mm A") : "Never"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <Badge type={stats.lastSyncStatus === "SUCCESS" ? "success" : stats.lastSyncStatus === "FAILED" ? "danger" : "primary"}>
                {stats.lastSyncStatus || "IDLE"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders Synced</p>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{stats.totalAmazonOrders || 0}</p>
            </div>
          </div>
          {stats.lastErrorMessage && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="text-xs text-red-600 dark:text-red-400">⚠ {stats.lastErrorMessage}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-button font-medium" onClick={handleSaveSettings} disabled={loading}>
          <FiSettings className="mr-2" /> Save Settings
        </Button>
        <Button className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-button font-medium" onClick={handleTestConnection} disabled={testing}>
          <FiPlay className="mr-2" /> {testing ? "Testing..." : "Test Connection"}
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-button font-medium" onClick={handleSyncOrders} disabled={syncing}>
          <FiRefreshCw className={`mr-2 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync Orders Now"}
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-button font-medium" onClick={handlePushStock} disabled={pushingStock}>
          <FiUploadCloud className="mr-2" /> {pushingStock ? "Pushing..." : "Push Inventory"}
        </Button>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-button font-medium" onClick={handleSimulateOrder} disabled={simulating}>
          <FiPlay className="mr-2" /> {simulating ? "Simulating..." : "Simulate Order"}
        </Button>
      </div>

      {/* Recent Sync Logs */}
      {logs.length > 0 && (
        <Card className="mt-4">
          <CardBody>
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Sync Logs</h4>
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Processed</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Time</TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell><span className="text-xs font-mono">{log.syncType}</span></TableCell>
                    <TableCell>
                      <Badge type={log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "danger" : "warning"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm">{log.recordsProcessed || 0}</span></TableCell>
                    <TableCell><span className="text-sm">{log.ordersCreated || 0}</span></TableCell>
                    <TableCell><span className="text-xs text-gray-500">{log.triggeredBy}</span></TableCell>
                    <TableCell><span className="text-xs text-gray-500">{dayjs(log.createdAt).format("DD MMM, hh:mm A")}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <>
      <PageTitle breadcrumb="Amazon Sync">
        <div className="flex items-center gap-3">
          <FaAmazon className="text-3xl text-orange-500" />
          <span>Amazon Sync</span>
          {settings.isEnabled && (
            <Badge type="success" className="ml-2">ACTIVE</Badge>
          )}
          {!settings.isEnabled && (
            <Badge type="neutral" className="ml-2">DISABLED</Badge>
          )}
          <Badge type={
            settings.mode === "production" ? "danger" :
            settings.mode === "sandbox" ? "warning" : "primary"
          } className="ml-1">
            {settings.mode?.toUpperCase()}
          </Badge>
        </div>
      </PageTitle>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button className={tabButtonClass("products")} onClick={() => setActiveTab("products")}>
          <FiBox className="inline mr-1" /> Products
        </button>
        <button className={tabButtonClass("orders")} onClick={() => setActiveTab("orders")}>
          <FiShoppingBag className="inline mr-1" /> Orders
        </button>
        <button className={tabButtonClass("settings")} onClick={() => setActiveTab("settings")}>
          <FiSettings className="inline mr-1" /> Settings
        </button>
      </div>

      {/* Tab Content */}
      <Card>
        <CardBody>
          {activeTab === "products" && renderProductsTab()}
          {activeTab === "orders" && renderOrdersTab()}
          {activeTab === "settings" && renderSettingsTab()}
        </CardBody>
      </Card>
    </>
  );
};

export default AmazonSync;
