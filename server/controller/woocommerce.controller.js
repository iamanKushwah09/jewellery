const WooCommerceSetting = require("../models/WooCommerceSetting.model");
const Order = require("../models/Order");
const WooCommerceApiService = require("../services/woocommerce/woocommerceApi.service");
const WooCommerceSyncService = require("../services/woocommerce/woocommerceSync.service");
const { restartWooCommerceCron } = require("../cron/woocommerceCron");

/**
 * Get current WooCommerce settings & metrics
 */
const getWooCommerceSettings = async (req, res) => {
  try {
    let settings = await WooCommerceSetting.findOne();
    if (!settings) {
      settings = new WooCommerceSetting();
      await settings.save();
    }

    const totalWcOrders = await Order.countDocuments({ source: "woocommerce" });
    const recentOrders = await Order.find({ source: "woocommerce" })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      settings: {
        ...settings.toObject(),
        consumerSecretMasked: settings.consumerSecret
          ? "••••••••" + settings.consumerSecret.slice(-4)
          : "",
      },
      stats: {
        totalOrders: totalWcOrders,
        lastOrderSyncAt: settings.lastOrderSyncAt,
        lastSyncStatus: settings.lastSyncStatus,
        lastErrorMessage: settings.lastErrorMessage,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update WooCommerce settings
 */
const updateWooCommerceSettings = async (req, res) => {
  try {
    let settings = await WooCommerceSetting.findOne();
    if (!settings) {
      settings = new WooCommerceSetting();
    }

    const {
      isEnabled,
      mode,
      storeUrl,
      consumerKey,
      consumerSecret,
      apiVersion,
      autoSyncOrders,
      syncIntervalMinutes,
      busySeries,
      busySaleType,
      busyPartyName,
      busyMatCenter,
      busyVchType,
    } = req.body;

    if (isEnabled !== undefined) settings.isEnabled = isEnabled;
    if (mode !== undefined) settings.mode = mode;
    if (storeUrl !== undefined) settings.storeUrl = WooCommerceApiService.normalizeStoreUrl(storeUrl);
    if (consumerKey !== undefined) settings.consumerKey = consumerKey.trim();
    if (consumerSecret !== undefined && !consumerSecret.includes("••••")) settings.consumerSecret = consumerSecret.trim();
    if (apiVersion !== undefined) settings.apiVersion = apiVersion.trim();
    if (autoSyncOrders !== undefined) settings.autoSyncOrders = autoSyncOrders;
    if (syncIntervalMinutes !== undefined) settings.syncIntervalMinutes = syncIntervalMinutes;

    if (busySeries !== undefined) settings.busySeries = busySeries;
    if (busySaleType !== undefined) settings.busySaleType = busySaleType;
    if (busyPartyName !== undefined) settings.busyPartyName = busyPartyName;
    if (busyMatCenter !== undefined) settings.busyMatCenter = busyMatCenter;
    if (busyVchType !== undefined) settings.busyVchType = busyVchType;

    await settings.save();
    await restartWooCommerceCron();

    res.status(200).json({
      success: true,
      message: "WooCommerce settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Test connection to WooCommerce Store
 */
const testWooCommerceConnection = async (req, res) => {
  try {
    const result = await WooCommerceApiService.testConnection();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Trigger manual order sync
 */
const triggerWooCommerceSync = async (req, res) => {
  try {
    const result = await WooCommerceSyncService.syncOrders("manual");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get synced WooCommerce orders
 */
const getWooCommerceOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { source: "woocommerce" };
    const totalDoc = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      orders,
      totalDoc,
      limits: limit,
      pages: Math.ceil(totalDoc / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * WooCommerce Webhook Endpoint
 */
const handleWooCommerceWebhook = async (req, res) => {
  try {
    const orderData = req.body;
    if (orderData && orderData.id) {
      await WooCommerceSyncService.ingestWooCommerceOrder(orderData, "webhook");
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("WooCommerce Webhook Error:", error.message);
    res.status(200).send("ERROR_LOGGED");
  }
};

module.exports = {
  getWooCommerceSettings,
  updateWooCommerceSettings,
  testWooCommerceConnection,
  triggerWooCommerceSync,
  getWooCommerceOrders,
  handleWooCommerceWebhook,
};
