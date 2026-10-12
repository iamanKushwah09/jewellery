const ShopifySetting = require("../models/ShopifySetting.model");
const Order = require("../models/Order");
const ShopifyApiService = require("../services/shopify/shopifyApi.service");
const ShopifySyncService = require("../services/shopify/shopifySync.service");
const { restartShopifyCron } = require("../cron/shopifyCron");

/**
 * Get current Shopify settings & metrics
 */
const getShopifySettings = async (req, res) => {
  try {
    let settings = await ShopifySetting.findOne();
    if (!settings) {
      settings = new ShopifySetting();
      await settings.save();
    }

    const totalShopifyOrders = await Order.countDocuments({ source: "shopify" });
    const recentOrders = await Order.find({ source: "shopify" })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      settings: {
        ...settings.toObject(),
        accessTokenMasked: settings.accessToken
          ? "••••••••" + settings.accessToken.slice(-4)
          : "",
      },
      stats: {
        totalOrders: totalShopifyOrders,
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
 * Update Shopify settings
 */
const updateShopifySettings = async (req, res) => {
  try {
    let settings = await ShopifySetting.findOne();
    if (!settings) {
      settings = new ShopifySetting();
    }

    const {
      isEnabled,
      mode,
      shopDomain,
      accessToken,
      apiVersion,
      webhookSecret,
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
    if (shopDomain !== undefined) settings.shopDomain = ShopifyApiService.normalizeDomain(shopDomain);
    if (accessToken !== undefined && !accessToken.includes("••••")) settings.accessToken = accessToken.trim();
    if (apiVersion !== undefined) settings.apiVersion = apiVersion.trim();
    if (webhookSecret !== undefined) settings.webhookSecret = webhookSecret.trim();
    if (autoSyncOrders !== undefined) settings.autoSyncOrders = autoSyncOrders;
    if (syncIntervalMinutes !== undefined) settings.syncIntervalMinutes = syncIntervalMinutes;

    if (busySeries !== undefined) settings.busySeries = busySeries;
    if (busySaleType !== undefined) settings.busySaleType = busySaleType;
    if (busyPartyName !== undefined) settings.busyPartyName = busyPartyName;
    if (busyMatCenter !== undefined) settings.busyMatCenter = busyMatCenter;
    if (busyVchType !== undefined) settings.busyVchType = busyVchType;

    await settings.save();
    await restartShopifyCron();

    res.status(200).json({
      success: true,
      message: "Shopify settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Test connection to Shopify Store
 */
const testShopifyConnection = async (req, res) => {
  try {
    const result = await ShopifyApiService.testConnection();
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
const triggerShopifySync = async (req, res) => {
  try {
    const result = await ShopifySyncService.syncOrders("manual");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get synced Shopify orders
 */
const getShopifyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { source: "shopify" };
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
 * Shopify Webhook Endpoint (e.g., orders/create or orders/updated)
 */
const handleShopifyWebhook = async (req, res) => {
  try {
    const orderData = req.body;
    if (orderData && (orderData.id || orderData.order_number)) {
      await ShopifySyncService.ingestShopifyOrder(orderData, "webhook");
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Shopify Webhook Error:", error.message);
    res.status(200).send("ERROR_LOGGED");
  }
};

module.exports = {
  getShopifySettings,
  updateShopifySettings,
  testShopifyConnection,
  triggerShopifySync,
  getShopifyOrders,
  handleShopifyWebhook,
};
