const AmazonSetting = require("../models/AmazonSetting.model");
const AmazonSyncLog = require("../models/AmazonSyncLog.model");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Item = require("../models/item.model");
const AmazonApiService = require("../services/amazon/amazonApi.service");
const AmazonSyncService = require("../services/amazon/amazonSync.service");
const { restartAmazonCron } = require("../cron/amazonCron");

/**
 * Get current Amazon settings & summary metrics
 */
const getAmazonSettings = async (req, res) => {
  try {
    let settings = await AmazonSetting.findOne();
    if (!settings) {
      settings = new AmazonSetting();
      await settings.save();
    }

    // Count synced Amazon orders
    const totalAmazonOrders = await Order.countDocuments({ source: "amazon" });
    const recentOrders = await Order.find({ source: "amazon" })
      .sort({ createdAt: -1 })
      .limit(5);

    // Latest logs
    const recentLogs = await AmazonSyncLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      settings: {
        ...settings.toObject(),
        // Mask secrets for safety
        lwaClientSecretMasked: settings.lwaClientSecret
          ? "••••••••" + settings.lwaClientSecret.slice(-4)
          : "",
        refreshTokenMasked: settings.refreshToken
          ? "••••••••" + settings.refreshToken.slice(-4)
          : "",
      },
      stats: {
        totalAmazonOrders,
        lastOrderSyncAt: settings.lastOrderSyncAt,
        lastStockSyncAt: settings.lastStockSyncAt,
        lastSyncStatus: settings.lastSyncStatus,
        lastErrorMessage: settings.lastErrorMessage,
      },
      recentOrders,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Amazon settings (Toggle switch, credentials, intervals)
 */
const updateAmazonSettings = async (req, res) => {
  try {
    let settings = await AmazonSetting.findOne();
    if (!settings) {
      settings = new AmazonSetting();
    }

    const {
      isEnabled,
      mode,
      lwaClientId,
      lwaClientSecret,
      refreshToken,
      sellerId,
      marketplaceId,
      autoSyncOrders,
      autoSyncStock,
      syncIntervalMinutes,
    } = req.body;

    if (isEnabled !== undefined) settings.isEnabled = isEnabled;
    if (mode !== undefined) settings.mode = mode;
    if (lwaClientId !== undefined) settings.lwaClientId = lwaClientId;
    if (lwaClientSecret !== undefined && lwaClientSecret !== "" && !lwaClientSecret.startsWith("••••")) {
      settings.lwaClientSecret = lwaClientSecret;
    }
    if (refreshToken !== undefined && refreshToken !== "" && !refreshToken.startsWith("••••")) {
      settings.refreshToken = refreshToken;
    }
    if (sellerId !== undefined) settings.sellerId = sellerId;
    if (marketplaceId !== undefined) settings.marketplaceId = marketplaceId;
    if (autoSyncOrders !== undefined) settings.autoSyncOrders = autoSyncOrders;
    if (autoSyncStock !== undefined) settings.autoSyncStock = autoSyncStock;
    if (syncIntervalMinutes !== undefined) settings.syncIntervalMinutes = syncIntervalMinutes;

    await settings.save();

    // Reconfigure background cron
    await restartAmazonCron();

    res.status(200).json({
      success: true,
      message: "Amazon synchronization settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Test connection with Amazon SP-API
 */
const testConnection = async (req, res) => {
  try {
    const result = await AmazonApiService.testConnection();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Trigger manual order synchronization
 */
const triggerOrderSync = async (req, res) => {
  try {
    const result = await AmazonSyncService.syncOrders("admin");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Trigger manual inventory push to Amazon
 */
const triggerInventoryPush = async (req, res) => {
  try {
    const result = await AmazonSyncService.pushInventoryToAmazon("admin");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Trigger simulated purchase event (Live testing)
 */
const simulateOrder = async (req, res) => {
  try {
    const result = await AmazonSyncService.simulatePurchase(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all Amazon synced orders with pagination
 */
const getAmazonOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { source: "amazon" };

    if (search) {
      query.$or = [
        { amazonOrderId: { $regex: search, $options: "i" } },
        { "user_info.name": { $regex: search, $options: "i" } },
        { "user_info.contact": { $regex: search, $options: "i" } },
        { amazonAsin: { $regex: search, $options: "i" } },
      ];
    }

    const totalDoc = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("user", "name email contact")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      orders,
      totalDoc,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Amazon sync audit logs
 */
const getAmazonLogs = async (req, res) => {
  try {
    const { page = 1, limit = 25, syncType } = req.query;
    const query = {};
    if (syncType) query.syncType = syncType;

    const totalDoc = await AmazonSyncLog.countDocuments(query);
    const logs = await AmazonSyncLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      logs,
      totalDoc,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Amazon Webhook / SNS Notification Receiver
 */
const handleWebhook = async (req, res) => {
  try {
    console.log("⚡ Amazon Webhook Event Received:", req.body);
    const result = await AmazonSyncService.processWebhook(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("⚡ Amazon Webhook Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get Products list with Amazon Mapping status (Supports Item & Product collections)
 */
const getMappedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "all" } = req.query;

    // Check Item collection count first
    const itemCount = await Item.countDocuments();
    const useItemModel = itemCount > 0;

    let products = [];
    let totalDoc = 0;
    let totalProducts = 0;
    let totalMapped = 0;

    if (useItemModel) {
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { item_code: { $regex: search, $options: "i" } },
          { "amazon.sku": { $regex: search, $options: "i" } },
          { "amazon.asin": { $regex: search, $options: "i" } },
        ];
      }

      if (filter === "mapped") {
        query.$or = [
          { "amazon.sku": { $exists: true, $ne: "" } },
          { "amazon.asin": { $exists: true, $ne: "" } },
        ];
      } else if (filter === "unmapped") {
        query.$and = [
          { $or: [{ "amazon.sku": { $in: ["", null] } }, { "amazon.sku": { $exists: false } }] },
          { $or: [{ "amazon.asin": { $in: ["", null] } }, { "amazon.asin": { $exists: false } }] },
        ];
      }

      totalDoc = await Item.countDocuments(query);
      const rawItems = await Item.find(query)
        .sort({ created_date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      products = rawItems.map((item) => ({
        _id: item._id,
        title: { en: item.name, name: item.name },
        sku: item.item_code || "",
        amazonSku: item.amazon?.sku || "",
        asin: item.amazon?.asin || "",
        stock: item.stock || 0,
        prices: { price: item.sale_price || item.mrp || 0 },
        image: item.image?.map((img) => (typeof img === "object" ? img.url || img.path : img)) || [],
        amazonSyncEnabled: item.amazon?.synced !== false,
      }));

      totalProducts = await Item.countDocuments();
      totalMapped = await Item.countDocuments({
        $or: [
          { "amazon.sku": { $exists: true, $ne: "" } },
          { "amazon.asin": { $exists: true, $ne: "" } },
        ],
      });
    } else {
      const query = { status: "show" };
      if (search) {
        query.$or = [
          { "title.en": { $regex: search, $options: "i" } },
          { "title.name": { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { amazonSku: { $regex: search, $options: "i" } },
          { asin: { $regex: search, $options: "i" } },
        ];
      }

      if (filter === "mapped") {
        query.$or = [
          { amazonSku: { $exists: true, $ne: "" } },
          { asin: { $exists: true, $ne: "" } },
        ];
      } else if (filter === "unmapped") {
        query.amazonSku = { $in: ["", null] };
        query.asin = { $in: ["", null] };
      }

      totalDoc = await Product.countDocuments(query);
      const rawProducts = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      products = rawProducts;
      totalProducts = await Product.countDocuments({ status: "show" });
      totalMapped = await Product.countDocuments({
        status: "show",
        $or: [
          { amazonSku: { $exists: true, $ne: "" } },
          { asin: { $exists: true, $ne: "" } },
        ],
      });
    }

    res.status(200).json({
      success: true,
      products,
      totalDoc,
      page: Number(page),
      limit: Number(limit),
      stats: {
        totalProducts,
        totalMapped,
        totalUnmapped: Math.max(0, totalProducts - totalMapped),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update single product mapping
 */
const updateProductMapping = async (req, res) => {
  try {
    const { productId, amazonSku, asin, amazonSyncEnabled } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Check Item model first
    let item = await Item.findById(productId);
    if (item) {
      if (!item.amazon) item.amazon = {};
      if (amazonSku !== undefined) item.amazon.sku = amazonSku.trim();
      if (asin !== undefined) item.amazon.asin = asin.trim();
      if (amazonSyncEnabled !== undefined) item.amazon.synced = amazonSyncEnabled;
      item.amazon.status = (amazonSku || asin) ? "SYNCED" : "UNMAPPED";
      await item.save();

      return res.status(200).json({
        success: true,
        message: `Amazon mapping updated for "${item.name}"`,
        item,
      });
    }

    // Fallback to Product model
    const product = await Product.findById(productId);
    if (product) {
      if (amazonSku !== undefined) product.amazonSku = amazonSku.trim();
      if (asin !== undefined) product.asin = asin.trim();
      if (amazonSyncEnabled !== undefined) product.amazonSyncEnabled = amazonSyncEnabled;
      await product.save();

      return res.status(200).json({
        success: true,
        message: `Amazon mapping updated for "${product.title?.en || "Product"}"`,
        product,
      });
    }

    res.status(404).json({ success: false, message: "Product or Item not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Push / Upload single product listing & stock to Amazon
 */
const uploadProductToAmazon = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    let title = "Product";
    let skuToUpload = "";
    let quantity = 0;
    let price = 0;

    const item = await Item.findById(productId);
    if (item) {
      title = item.name;
      skuToUpload = item.amazon?.sku || item.item_code || `AMZ-${item._id.toString().slice(-6)}`;
      quantity = item.stock || 0;
      price = item.sale_price || item.mrp || 0;

      if (!item.amazon) item.amazon = {};
      item.amazon.sku = skuToUpload;
      item.amazon.synced = true;
      item.amazon.status = "SYNCED";
      item.amazon.lastSyncedAt = new Date();
      await item.save();
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      title = product.title?.en || "Product";
      skuToUpload = product.amazonSku || product.sku || `AMZ-${product._id.toString().slice(-6)}`;
      quantity = product.stock || 0;
      price = product.prices?.price || 0;

      product.amazonSku = skuToUpload;
      product.amazonSyncEnabled = true;
      await product.save();
    }

    // Call Amazon Inventory API
    const apiResult = await AmazonApiService.updateInventory([
      { sku: skuToUpload, quantity, price },
    ]);

    // Log the upload activity
    const log = new AmazonSyncLog({
      syncType: "INVENTORY_PUSH",
      status: "SUCCESS",
      recordsProcessed: 1,
      itemsUpdated: 1,
      details: {
        action: "SINGLE_PRODUCT_UPLOAD",
        productId,
        sku: skuToUpload,
        price,
        quantity,
      },
      triggeredBy: "admin",
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: `Listing for "${title}" (${skuToUpload}) successfully pushed to Amazon!`,
      apiResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Auto-map all unmapped products with Amazon SKUs
 */
const autoMapAllProducts = async (req, res) => {
  try {
    let mappedCount = 0;

    // Auto-map Items
    const items = await Item.find({
      $or: [
        { "amazon.sku": { $in: ["", null] } },
        { "amazon.sku": { $exists: false } },
        { amazon: { $exists: false } },
      ],
    });

    for (const item of items) {
      const generatedSku = item.item_code || `AMZ-${item._id.toString().slice(-6)}`.toUpperCase();
      if (!item.amazon) item.amazon = {};
      item.amazon.sku = generatedSku;
      item.amazon.synced = true;
      item.amazon.status = "SYNCED";
      await item.save();
      mappedCount++;
    }

    // Auto-map Products
    const products = await Product.find({
      status: "show",
      $or: [
        { amazonSku: { $in: ["", null] } },
        { amazonSku: { $exists: false } },
      ],
    });

    for (const prod of products) {
      const generatedSku = prod.sku || `AMZ-${prod.slug || prod._id.toString().slice(-6)}`.toUpperCase();
      prod.amazonSku = generatedSku;
      prod.amazonSyncEnabled = true;
      await prod.save();
      mappedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully auto-mapped ${mappedCount} products with Amazon SKUs!`,
      mappedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAmazonSettings,
  updateAmazonSettings,
  testConnection,
  triggerOrderSync,
  triggerInventoryPush,
  simulateOrder,
  getAmazonOrders,
  getAmazonLogs,
  handleWebhook,
  getMappedProducts,
  updateProductMapping,
  uploadProductToAmazon,
  autoMapAllProducts,
};
