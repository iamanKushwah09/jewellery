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
  FiCheckCircle,
  FiAlertTriangle,
  FiSave,
} from "react-icons/fi";
import { SiShopify } from "react-icons/si";
import ShopifyServices from "@/services/ShopifyServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import PageTitle from "@/components/Typography/PageTitle";
import dayjs from "dayjs";

const ShopifySync = () => {
  const [activeTab, setActiveTab] = useState("settings"); // 'settings' | 'orders'
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    isEnabled: false,
    mode: "simulation",
    shopDomain: "",
    accessToken: "",
    apiVersion: "2024-04",
    webhookSecret: "",
    autoSyncOrders: true,
    syncIntervalMinutes: 15,
    busySeries: "MAIN",
    busySaleType: "L/GST 18%",
    busyPartyName: "SHOPIFY CUSTOMERS",
    busyMatCenter: "Main Store",
    busyVchType: 9,
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    lastOrderSyncAt: null,
    lastSyncStatus: "IDLE",
    lastErrorMessage: "",
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await ShopifyServices.getSettings();
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
        if (res.stats) setStats(res.stats);
        if (res.recentOrders) setOrders(res.recentOrders);
      }
    } catch (err) {
      notifyError(err ? err.response?.data?.message || err.message : "Failed to load Shopify settings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await ShopifyServices.getOrders({ page, limit: 10 });
      if (res && res.orders) {
        setOrders(res.orders);
        setTotalOrders(res.totalDoc || 0);
      }
    } catch (err) {
      notifyError("Failed to fetch Shopify orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await ShopifyServices.updateSettings(settings);
      if (res.success) {
        notifySuccess("Shopify settings saved successfully!");
        fetchSettings();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const res = await ShopifyServices.testConnection();
      if (res.success) {
        notifySuccess(res.message || "Shopify connection test successful!");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || "Shopify connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const res = await ShopifyServices.syncNow();
      if (res.success) {
        notifySuccess(res.message || `Sync completed! Processed: ${res.processed}, New: ${res.created}`);
        fetchSettings();
        if (activeTab === "orders") fetchOrders(1);
      } else {
        notifyError(res.message || res.error || "Sync failed");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || "Sync execution error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <PageTitle>
        <div className="flex items-center gap-3">
          <SiShopify className="text-emerald-500 text-3xl" />
          <span>Shopify Store Sync & Integration</span>
        </div>
      </PageTitle>

      {/* Top Status Card */}
      <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  settings.isEnabled
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                }`}
              >
                <SiShopify className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  Shopify Channel Status:
                  {settings.isEnabled ? (
                    <Badge type="success">Active & Enabled</Badge>
                  ) : (
                    <Badge type="danger">Disabled</Badge>
                  )}
                  <Badge type={settings.mode === "production" ? "warning" : "primary"}>
                    {settings.mode === "production" ? "Live Production" : "Simulation Mode"}
                  </Badge>
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connected Store:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {settings.shopDomain || "Not Configured"}
                  </span>{" "}
                  | Total Orders Synced:{" "}
                  <span className="font-bold text-emerald-600">{stats.totalOrders}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                layout="outline"
                size="small"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2"
              >
                <FiCheckCircle className={testing ? "animate-spin" : ""} />
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                size="small"
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FiRefreshCw className={syncing ? "animate-spin" : ""} />
                {syncing ? "Syncing..." : "Sync Orders Now"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-3 px-6 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <FiSettings /> Settings & Credentials
        </button>
        <button
          onClick={() => {
            setActiveTab("orders");
            fetchOrders(1);
          }}
          className={`py-3 px-6 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <FiShoppingBag /> Synced Orders ({stats.totalOrders})
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === "settings" && (
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: API Credentials */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 border-b pb-2">
                  Shopify API Configuration
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enable Shopify Integration
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      id="isEnabled"
                      checked={settings.isEnabled}
                      onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="isEnabled" className="text-sm text-gray-600 dark:text-gray-300">
                      Enable automatic background synchronization
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operating Mode
                  </label>
                  <select
                    value={settings.mode}
                    onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  >
                    <option value="simulation">Simulation Mode (Test without live credentials)</option>
                    <option value="production">Live Production (Official Shopify Store)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shopify Store Domain
                  </label>
                  <input
                    type="text"
                    placeholder="your-store.myshopify.com"
                    value={settings.shopDomain || ""}
                    onChange={(e) => setSettings({ ...settings, shopDomain: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                  <span className="text-xs text-gray-400">
                    Your Shopify store sub-domain (e.g., example.myshopify.com)
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin API Access Token
                  </label>
                  <input
                    type="password"
                    placeholder={settings.accessTokenMasked || "shpat_xxxxxxxxxxxxxxxxxxxxx"}
                    value={settings.accessToken || ""}
                    onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                  <span className="text-xs text-gray-400">
                    Generated from Shopify Admin → Apps → App development
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Version
                    </label>
                    <input
                      type="text"
                      value={settings.apiVersion || "2024-04"}
                      onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
                      className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={settings.webhookSecret || ""}
                      onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
                      className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Busy ERP Accounting Mapping */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 border-b pb-2">
                  Busy ERP Accounting & Order Rules
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Busy Voucher Series
                  </label>
                  <input
                    type="text"
                    value={settings.busySeries || "MAIN"}
                    onChange={(e) => setSettings({ ...settings, busySeries: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                  <span className="text-xs text-gray-400">Series name in Busy (default: MAIN)</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Busy Sale Type
                  </label>
                  <input
                    type="text"
                    value={settings.busySaleType || "L/GST 18%"}
                    onChange={(e) => setSettings({ ...settings, busySaleType: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                  <span className="text-xs text-gray-400">GST Sale Type (e.g., L/GST 18% or I/GST 18%)</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Busy Party / Customer Ledger
                  </label>
                  <input
                    type="text"
                    value={settings.busyPartyName || "SHOPIFY CUSTOMERS"}
                    onChange={(e) => setSettings({ ...settings, busyPartyName: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                  <span className="text-xs text-gray-400">Customer account in Busy for Shopify sales</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Busy Material Center (Godown)
                  </label>
                  <input
                    type="text"
                    value={settings.busyMatCenter || "Main Store"}
                    onChange={(e) => setSettings({ ...settings, busyMatCenter: e.target.value })}
                    className="w-full p-2.5 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                <FiSave /> {loading ? "Saving..." : "Save Shopify Settings"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === "orders" && (
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800">
          <CardBody>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <SiShopify className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-base font-semibold">No Shopify orders synced yet</p>
                <p className="text-sm mt-1">Click "Sync Orders Now" above to ingest orders from Shopify.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Order ID / No</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, i) => (
                      <TableRow key={order._id || i}>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            #{order.shopifyOrderId || order._id?.slice(-6)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {order.user_info?.name || "Customer"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.user_info?.city || ""}, {order.user_info?.contact || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {order.cart?.map((c) => `${c.title} (x${c.quantity})`).join(", ") || "1 item"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-gray-900 dark:text-white">
                            ₹{order.grandTotal || order.total || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            type={
                              order.status === "Delivered"
                                ? "success"
                                : order.status === "Cancel"
                                ? "danger"
                                : "primary"
                            }
                          >
                            {order.status || "Processing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{order.paymentMethod}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TableFooter>
                  <Pagination
                    totalResults={totalOrders}
                    resultsPerPage={10}
                    onChange={(p) => {
                      setOrdersPage(p);
                      fetchOrders(p);
                    }}
                    label="Shopify Orders Navigation"
                  />
                </TableFooter>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default ShopifySync;
