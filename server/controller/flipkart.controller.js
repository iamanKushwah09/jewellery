const FlipkartSetting = require("../models/FlipkartSetting.model");
const FlipkartSyncLog = require("../models/FlipkartSyncLog.model");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Item = require("../models/item.model");
const FlipkartApiService = require("../services/flipkart/flipkartApi.service");
const FlipkartSyncService = require("../services/flipkart/flipkartSync.service");
const { restartFlipkartCron } = require("../cron/flipkartCron");

/**
 * Get current Flipkart settings & summary metrics
 */
const getFlipkartSettings = async (req, res) => {
  try {
    let settings = await FlipkartSetting.findOne();
    if (!settings) {
      settings = new FlipkartSetting();
      await settings.save();
    }

    // Count synced Flipkart orders
    const totalFlipkartOrders = await Order.countDocuments({ source: "flipkart" });
    const recentOrders = await Order.find({ source: "flipkart" })
      .sort({ createdAt: -1 })
      .limit(5);

    // Latest logs
    const recentLogs = await FlipkartSyncLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      settings: {
        ...settings.toObject(),
        // Mask secret for safety
        appSecretMasked: settings.appSecret ? "••••••••" + settings.appSecret.slice(-4) : "",
      },
      stats: {
        totalFlipkartOrders,
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
 * Update Flipkart settings (Toggle switch, credentials, intervals)
 */
const updateFlipkartSettings = async (req, res) => {
  try {
    let settings = await FlipkartSetting.findOne();
    if (!settings) {
      settings = new FlipkartSetting();
    }

    const {
      isEnabled,
      mode,
      appId,
      appSecret,
      sellerId,
      locationId,
      autoSyncOrders,
      autoSyncStock,
      syncIntervalMinutes,
      webhookSecret,
    } = req.body;

    if (isEnabled !== undefined) settings.isEnabled = isEnabled;
    if (mode !== undefined) settings.mode = mode;
    if (appId !== undefined) settings.appId = appId;
    if (appSecret !== undefined && appSecret !== "" && !appSecret.startsWith("••••")) {
      settings.appSecret = appSecret;
    }
    if (sellerId !== undefined) settings.sellerId = sellerId;
    if (locationId !== undefined) settings.locationId = locationId;
    if (autoSyncOrders !== undefined) settings.autoSyncOrders = autoSyncOrders;
    if (autoSyncStock !== undefined) settings.autoSyncStock = autoSyncStock;
    if (syncIntervalMinutes !== undefined) settings.syncIntervalMinutes = syncIntervalMinutes;
    if (webhookSecret !== undefined) settings.webhookSecret = webhookSecret;

    await settings.save();

    // Reconfigure background cron
    await restartFlipkartCron();

    res.status(200).json({
      success: true,
      message: "Flipkart synchronization settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Test connection with Flipkart API
 */
const testConnection = async (req, res) => {
  try {
    const result = await FlipkartApiService.testConnection();
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
    const result = await FlipkartSyncService.syncOrders("admin");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Trigger manual inventory push to Flipkart
 */
const triggerInventoryPush = async (req, res) => {
  try {
    const result = await FlipkartSyncService.pushInventoryToFlipkart("admin");
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
    const result = await FlipkartSyncService.simulatePurchase(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all Flipkart synced orders with pagination
 */
const getFlipkartOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { source: "flipkart" };

    if (search) {
      query.$or = [
        { flipkartOrderId: { $regex: search, $options: "i" } },
        { "user_info.name": { $regex: search, $options: "i" } },
        { "user_info.contact": { $regex: search, $options: "i" } },
        { flipkartSku: { $regex: search, $options: "i" } },
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
 * Get Flipkart sync audit logs
 */
const getFlipkartLogs = async (req, res) => {
  try {
    const { page = 1, limit = 25, syncType } = req.query;
    const query = {};
    if (syncType) query.syncType = syncType;

    const totalDoc = await FlipkartSyncLog.countDocuments(query);
    const logs = await FlipkartSyncLog.find(query)
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
 * Flipkart Webhook Receiver
 */
const handleWebhook = async (req, res) => {
  try {
    console.log("⚡ Flipkart Webhook Event Received:", req.body);
    const result = await FlipkartSyncService.processWebhook(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("⚡ Flipkart Webhook Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get Products list with Flipkart Mapping status (Supports Item & Product collections)
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
          { "flipkart.sku": { $regex: search, $options: "i" } },
          { "flipkart.fsn": { $regex: search, $options: "i" } },
        ];
      }

      if (filter === "mapped") {
        query.$or = [
          { "flipkart.sku": { $exists: true, $ne: "" } },
          { "flipkart.fsn": { $exists: true, $ne: "" } },
        ];
      } else if (filter === "unmapped") {
        query.$and = [
          { $or: [{ "flipkart.sku": { $in: ["", null] } }, { "flipkart.sku": { $exists: false } }] },
          { $or: [{ "flipkart.fsn": { $in: ["", null] } }, { "flipkart.fsn": { $exists: false } }] },
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
        flipkartSku: item.flipkart?.sku || "",
        fsn: item.flipkart?.fsn || "",
        stock: item.stock || 0,
        prices: { price: item.sale_price || item.mrp || 0 },
        image: item.image?.map((img) => (typeof img === "object" ? img.url || img.path : img)) || [],
        flipkartSyncEnabled: item.flipkart?.synced !== false,
      }));

      totalProducts = await Item.countDocuments();
      totalMapped = await Item.countDocuments({
        $or: [
          { "flipkart.sku": { $exists: true, $ne: "" } },
          { "flipkart.fsn": { $exists: true, $ne: "" } },
        ],
      });
    } else {
      const query = { status: "show" };
      if (search) {
        query.$or = [
          { "title.en": { $regex: search, $options: "i" } },
          { "title.name": { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { flipkartSku: { $regex: search, $options: "i" } },
          { fsn: { $regex: search, $options: "i" } },
        ];
      }

      if (filter === "mapped") {
        query.$or = [
          { flipkartSku: { $exists: true, $ne: "" } },
          { fsn: { $exists: true, $ne: "" } },
        ];
      } else if (filter === "unmapped") {
        query.flipkartSku = { $in: ["", null] };
        query.fsn = { $in: ["", null] };
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
          { flipkartSku: { $exists: true, $ne: "" } },
          { fsn: { $exists: true, $ne: "" } },
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
    const { productId, flipkartSku, fsn, flipkartSyncEnabled } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Check Item model first
    let item = await Item.findById(productId);
    if (item) {
      if (!item.flipkart) item.flipkart = {};
      if (flipkartSku !== undefined) item.flipkart.sku = flipkartSku.trim();
      if (fsn !== undefined) item.flipkart.fsn = fsn.trim();
      if (flipkartSyncEnabled !== undefined) item.flipkart.synced = flipkartSyncEnabled;
      item.flipkart.status = (flipkartSku || fsn) ? "SYNCED" : "UNMAPPED";
      await item.save();

      return res.status(200).json({
        success: true,
        message: `Flipkart mapping updated for "${item.name}"`,
        item,
      });
    }

    // Fallback to Product model
    const product = await Product.findById(productId);
    if (product) {
      if (flipkartSku !== undefined) product.flipkartSku = flipkartSku.trim();
      if (fsn !== undefined) product.fsn = fsn.trim();
      if (flipkartSyncEnabled !== undefined) product.flipkartSyncEnabled = flipkartSyncEnabled;
      await product.save();

      return res.status(200).json({
        success: true,
        message: `Flipkart mapping updated for "${product.title?.en || 'Product'}"`,
        product,
      });
    }

    res.status(404).json({ success: false, message: "Product or Item not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Push / Upload single product listing & stock to Flipkart
 */
const uploadProductToFlipkart = async (req, res) => {
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
      skuToUpload = item.flipkart?.sku || item.item_code || `FK-${item._id.toString().slice(-6)}`;
      quantity = item.stock || 0;
      price = item.sale_price || item.mrp || 0;

      if (!item.flipkart) item.flipkart = {};
      item.flipkart.sku = skuToUpload;
      item.flipkart.synced = true;
      item.flipkart.status = "SYNCED";
      item.flipkart.lastSyncedAt = new Date();
      await item.save();
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      title = product.title?.en || "Product";
      skuToUpload = product.flipkartSku || product.sku || `FK-${product._id.toString().slice(-6)}`;
      quantity = product.stock || 0;
      price = product.prices?.price || 0;

      product.flipkartSku = skuToUpload;
      product.flipkartSyncEnabled = true;
      await product.save();
    }

    // Call Flipkart Listings API
    const apiResult = await FlipkartApiService.updateInventory([
      { sku: skuToUpload, quantity, price },
    ]);

    // Log the upload activity
    const log = new FlipkartSyncLog({
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
      message: `Listing for "${title}" (${skuToUpload}) successfully pushed to Flipkart!`,
      apiResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Auto-map all unmapped products with Flipkart SKUs
 */
const autoMapAllProducts = async (req, res) => {
  try {
    let mappedCount = 0;

    // Auto-map Items
    const items = await Item.find({
      $or: [
        { "flipkart.sku": { $in: ["", null] } },
        { "flipkart.sku": { $exists: false } },
        { flipkart: { $exists: false } },
      ],
    });

    for (const item of items) {
      const generatedSku = item.item_code || `FK-${item._id.toString().slice(-6)}`.toUpperCase();
      if (!item.flipkart) item.flipkart = {};
      item.flipkart.sku = generatedSku;
      item.flipkart.synced = true;
      item.flipkart.status = "SYNCED";
      await item.save();
      mappedCount++;
    }

    // Auto-map Products
    const products = await Product.find({
      status: "show",
      $or: [
        { flipkartSku: { $in: ["", null] } },
        { flipkartSku: { $exists: false } },
      ],
    });

    for (const prod of products) {
      const generatedSku = prod.sku || `FK-${prod.slug || prod._id.toString().slice(-6)}`.toUpperCase();
      prod.flipkartSku = generatedSku;
      prod.flipkartSyncEnabled = true;
      await prod.save();
      mappedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully auto-mapped ${mappedCount} products with Flipkart SKUs!`,
      mappedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFlipkartSettings,
  updateFlipkartSettings,
  testConnection,
  triggerOrderSync,
  triggerInventoryPush,
  simulateOrder,
  getFlipkartOrders,
  getFlipkartLogs,
  handleWebhook,
  getMappedProducts,
  updateProductMapping,
  uploadProductToFlipkart,
  autoMapAllProducts,
};
