const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Item = require("../../models/item.model");
const Customer = require("../../models/Customer");
const SaleOrder = require("../../models/saleorder.model");
const SaleType = require("../../models/SaleType.model");
const Salesman = require("../../models/Sales.model");
const CustomerModel = require("../../models/customer.model");
const FlipkartSetting = require("../../models/FlipkartSetting.model");
const FlipkartSyncLog = require("../../models/FlipkartSyncLog.model");
const FlipkartApiService = require("./flipkartApi.service");
const { recordStockMovement } = require("../inventory.service");

/**
 * Flipkart Synchronization Engine
 * Handles order ingestion, deduplication, stock deduction, and inventory synchronization
 */
class FlipkartSyncService {
  /**
   * Helper to find or create a Flipkart virtual/system customer
   */
  static async getOrCreateFlipkartCustomer(buyerDetails = {}) {
    const email = buyerDetails.email || `flipkart.buyer.${Date.now()}@flipkart.marketplace`;
    const contact = buyerDetails.contact || buyerDetails.phone || "9999999999";
    const name = buyerDetails.name || "Flipkart Customer";

    let customer = await Customer.findOne({ $or: [{ email }, { contact }] });
    if (!customer) {
      customer = new Customer({
        name,
        email,
        phone: contact,
        contact,
        address: buyerDetails.address || "Flipkart Marketplace Order",
        city: buyerDetails.city || "Online",
        country: "India",
        zipCode: buyerDetails.zipCode || "110001",
      });
      await customer.save();
    }
    return customer;
  }

  /**
   * Deduct stock for products included in an order (Supports Item and Product)
   */
  static async deductLocalStock(cartItems = []) {
    const updatedProducts = [];

    for (const item of cartItems) {
      const qtyToDeduct = Number(item.quantity) || 1;

      // 1. Try Item collection first
      let matchedItem = null;
      if (item.id && mongoose.Types.ObjectId.isValid(item.id)) {
        matchedItem = await Item.findById(item.id);
      }
      if (!matchedItem && item.sku) {
        matchedItem = await Item.findOne({
          $or: [{ item_code: item.sku }, { "flipkart.sku": item.sku }, { "flipkart.fsn": item.sku }],
        });
      }

      if (matchedItem) {
        const previousStock = matchedItem.stock || 0;
        const newStock = Math.max(0, previousStock - qtyToDeduct);
        matchedItem.stock = newStock;
        await matchedItem.save();

        try {
          await recordStockMovement({
            item: matchedItem,
            previous_stock: previousStock,
            current_stock: newStock,
            movement_type: "OUT",
            reference_type: "FLIPKART_ORDER",
            reference_id: orderId || "",
            channel: "FLIPKART",
            source_code: 5,
            source_name: "Item Sale",
            notes: `Flipkart order deduction: -${qtyToDeduct} ${matchedItem.unit || 'units'} (Order #${orderId || "N/A"})`,
            updated_by: "Flipkart Sync",
          });
        } catch (invErr) {
          console.error("Error logging Flipkart stock deduction:", invErr);
        }

        updatedProducts.push({
          itemId: matchedItem._id,
          title: matchedItem.name,
          sku: matchedItem.item_code || matchedItem.flipkart?.sku,
          previousStock,
          newStock,
          deductedQuantity: qtyToDeduct,
        });
        continue;
      }

      // 2. Try Product collection
      let product = null;
      if (item.id && mongoose.Types.ObjectId.isValid(item.id)) {
        product = await Product.findById(item.id);
      }
      if (!product && item.sku) {
        product = await Product.findOne({ $or: [{ sku: item.sku }, { flipkartSku: item.sku }, { fsn: item.sku }] });
      }

      if (product) {
        const previousStock = product.stock || 0;
        const newStock = Math.max(0, previousStock - qtyToDeduct);
        const previousSales = product.sales || 0;

        product.stock = newStock;
        product.sales = previousSales + qtyToDeduct;
        await product.save();

        updatedProducts.push({
          productId: product._id,
          title: product.title?.en || product.title?.name || "Product",
          sku: product.sku || product.flipkartSku,
          previousStock,
          newStock,
          deductedQuantity: qtyToDeduct,
        });
      }
    }

    return updatedProducts;
  }

  /**
   * Ingest a single raw Flipkart order item into the local database
   */
  static async ingestFlipkartOrderItem(flipkartOrder, triggeredBy = "system") {
    const flipkartOrderId = flipkartOrder.orderId || flipkartOrder.order_id || flipkartOrder.orderItemId;
    const flipkartOrderItemId = flipkartOrder.orderItemId || flipkartOrder.order_item_id || flipkartOrderId;

    if (!flipkartOrderId) {
      throw new Error("Missing Flipkart Order ID");
    }

    // Check if order already exists in our system (Idempotency)
    let existingOrder = await Order.findOne({
      $or: [{ flipkartOrderId }, { flipkartOrderItemId }],
    });

    if (existingOrder) {
      // Update status if changed
      const newStatus = flipkartOrder.orderStatus || flipkartOrder.status || existingOrder.status;
      if (newStatus && existingOrder.flipkartOrderStatus !== newStatus) {
        existingOrder.flipkartOrderStatus = newStatus;
        if (newStatus.toUpperCase() === "CANCELLED" || newStatus.toUpperCase() === "CANCEL") {
          existingOrder.status = "Cancel";
        } else if (newStatus.toUpperCase() === "DELIVERED") {
          existingOrder.status = "Delivered";
        } else if (newStatus.toUpperCase() === "SHIPPED") {
          existingOrder.status = "Processing";
        }
        await existingOrder.save();

        try {
          const matchingSO = await SaleOrder.findOne({
            description: { $regex: flipkartOrderId, $options: "i" },
          });
          if (matchingSO) {
            if (newStatus.toUpperCase() === "CANCELLED" || newStatus.toUpperCase() === "CANCEL") {
              matchingSO.status = "Cancelled";
            } else if (newStatus.toUpperCase() === "DELIVERED") {
              matchingSO.status = "Delivered";
            } else if (newStatus.toUpperCase() === "SHIPPED") {
              matchingSO.status = "Dispatched";
            }
            await matchingSO.save();
          }
        } catch (soUpdateErr) {
          console.error("SaleOrder status sync error:", soUpdateErr.message);
        }
      }
      return { isNew: false, order: existingOrder };
    }

    // Find matching product in local database (check Item collection first, then Product)
    const sku = flipkartOrder.sku || flipkartOrder.fsn || flipkartOrder.listingId || "";
    let matchedItem = null;
    let matchedProduct = null;

    if (flipkartOrder.productId && mongoose.Types.ObjectId.isValid(flipkartOrder.productId)) {
      matchedItem = await Item.findById(flipkartOrder.productId);
      if (!matchedItem) matchedProduct = await Product.findById(flipkartOrder.productId);
    }

    if (!matchedItem && !matchedProduct && sku) {
      matchedItem = await Item.findOne({
        $or: [{ item_code: sku }, { "flipkart.sku": sku }, { "flipkart.fsn": sku }],
      });
      if (!matchedItem) {
        matchedProduct = await Product.findOne({
          $or: [{ sku: sku }, { flipkartSku: sku }, { fsn: sku }],
        });
      }
    }

    // If still not matched, fallback to first item
    if (!matchedItem && !matchedProduct) {
      matchedItem = await Item.findOne();
      if (!matchedItem) matchedProduct = await Product.findOne({ status: "show" });
    }

    const price = Number(
      flipkartOrder.price ||
      flipkartOrder.priceComponents?.sellingPrice ||
      matchedItem?.sale_price ||
      matchedItem?.mrp ||
      matchedProduct?.prices?.price ||
      499
    );
    const quantity = Number(flipkartOrder.quantity || 1);
    const itemTitle = matchedItem?.name || matchedProduct?.title?.en || matchedProduct?.title?.name || flipkartOrder.title || "Flipkart Marketplace Product";
    const rawImage = matchedItem?.image || matchedProduct?.image || (flipkartOrder.image ? [flipkartOrder.image] : []);
    const itemImage = Array.isArray(rawImage)
      ? rawImage.map(img => typeof img === 'object' ? img.url || img.path : img)
      : [rawImage];

    const cartItem = {
      id: matchedItem ? matchedItem._id.toString() : matchedProduct ? matchedProduct._id.toString() : `fk_${Date.now()}`,
      title: itemTitle,
      slug: matchedProduct?.slug || `fk-item-${matchedItem?._id || Date.now()}`,
      image: itemImage,
      originalPrice: Number(matchedItem?.mrp || matchedProduct?.prices?.originalPrice || price),
      price: price,
      quantity: quantity,
      itemTotal: price * quantity,
      variant: {
        sku: sku || matchedItem?.item_code || matchedItem?.flipkart?.sku || matchedProduct?.sku || "",
      },
    };

    // Buyer Information
    const buyerInfo = {
      name: flipkartOrder.buyerName || flipkartOrder.customerName || "Flipkart Buyer",
      email: flipkartOrder.buyerEmail || `buyer_${flipkartOrderId}@flipkart.in`,
      contact: flipkartOrder.buyerPhone || flipkartOrder.contact || "9876543210",
      address: flipkartOrder.shippingAddress?.addressLine1 || flipkartOrder.address || "Flipkart Delivery Address",
      city: flipkartOrder.shippingAddress?.city || flipkartOrder.city || "New Delhi",
      country: "India",
      zipCode: flipkartOrder.shippingAddress?.pincode || flipkartOrder.zipCode || "110001",
    };

    const customer = await this.getOrCreateFlipkartCustomer(buyerInfo);

    const subTotal = price * quantity;
    const shippingCost = Number(flipkartOrder.shippingCharge || 0);
    const discount = Number(flipkartOrder.discount || 0);
    const grandTotal = subTotal + shippingCost - discount;

    const newOrder = new Order({
      user: customer._id,
      cart: [cartItem],
      user_info: buyerInfo,
      subTotal,
      shippingCost,
      discount,
      total: grandTotal,
      grandTotal: grandTotal,
      paymentMethod: flipkartOrder.paymentType || "Flipkart Marketplace Prepaid",
      status: "Processing",
      source: "flipkart",
      flipkartOrderId,
      flipkartOrderItemId,
      flipkartTrackingId: flipkartOrder.trackingId || `FKTRK${Date.now()}`,
      flipkartOrderStatus: flipkartOrder.orderStatus || "APPROVED",
      flipkartSku: sku,
    });

    await newOrder.save();

    // Also create matching SaleOrder so it appears in /sale-order page
    let saleOrder = null;
    try {
      saleOrder = await this.createMatchingSaleOrder({
        flipkartOrderId,
        flipkartOrderItemId,
        matchedItem,
        matchedProduct,
        price,
        quantity,
        buyerInfo,
        trackingId: flipkartOrder.trackingId,
      });
    } catch (soErr) {
      console.error("SaleOrder creation error:", soErr.message);
    }

    // Deduct stock locally if setting enabled
    const settings = await FlipkartSetting.findOne();
    let stockUpdates = [];
    if (!settings || settings.autoSyncStock) {
      stockUpdates = await this.deductLocalStock([cartItem]);
    }

    return {
      isNew: true,
      order: newOrder,
      saleOrder,
      stockUpdates,
    };
  }

  /**
   * Create or sync matching SaleOrder record for admin ERP / Sales Order views
   */
  static async createMatchingSaleOrder({ flipkartOrderId, flipkartOrderItemId, matchedItem, matchedProduct, price, quantity, buyerInfo, trackingId }) {
    try {
      // Check if SaleOrder already exists for this flipkartOrderId
      const existingSaleOrder = await SaleOrder.findOne({
        $or: [
          { description: { $regex: flipkartOrderId, $options: "i" } },
          { voucherNo: { $regex: flipkartOrderId.slice(-6), $options: "i" } },
        ],
      });

      if (existingSaleOrder) {
        return existingSaleOrder;
      }

      // Find active SaleType & Salesman
      const saleTypeDoc = (await SaleType.findOne({ status: "active" })) || (await SaleType.findOne());
      const salesmanDoc = (await Salesman.findOne({ name: "General" })) || (await Salesman.findOne());

      // Find or create customer in customer.model collection
      let customerDoc = await CustomerModel.findOne({
        $or: [{ email: buyerInfo.email }, { mobile: buyerInfo.contact }],
      });

      if (!customerDoc) {
        customerDoc = new CustomerModel({
          name: buyerInfo.name || "Flipkart Customer",
          email: buyerInfo.email,
          mobile: buyerInfo.contact,
          address: buyerInfo.address,
          city_id: buyerInfo.city,
          pincode: buyerInfo.zipCode,
          is_active: true,
        });
        await customerDoc.save();
      }

      const subTotal = price * quantity;
      const itemName = matchedItem?.name || matchedProduct?.title?.en || matchedProduct?.title?.name || "Flipkart Marketplace Product";
      let itemImg = "";
      const rawImg = matchedItem?.image || matchedProduct?.image;
      if (Array.isArray(rawImg) && rawImg.length > 0) {
        const first = rawImg[0];
        itemImg = typeof first === "object" ? first?.url || first?.path || "" : String(first);
      } else if (rawImg && typeof rawImg === "object") {
        itemImg = rawImg.url || rawImg.path || "";
      } else if (typeof rawImg === "string") {
        itemImg = rawImg;
      }

      const saleOrderItems = [
        {
          itemId: matchedItem?._id || (await Item.findOne())?._id,
          name: itemName,
          image: itemImg || "",
          listPrice: price,
          price: price,
          quantity: quantity,
          unit: matchedItem?.unit || "PCS",
          conversion_factor: matchedItem?.conversion_factor || 1,
          discount: 0,
          totalDiscount: 0,
          amount: subTotal,
          description: `Flipkart Order Item ${flipkartOrderItemId || flipkartOrderId}`,
        },
      ];

      const newSaleOrder = new SaleOrder({
        voucherNo: `SO-FK-${flipkartOrderId ? flipkartOrderId.slice(-6).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`,
        saleType: saleTypeDoc?._id,
        saleTypeCode: saleTypeDoc?.code ? String(saleTypeDoc.code) : "1",
        matCentre: "MAIN",
        date: new Date(),
        customer: customerDoc._id,
        customerCode: customerDoc.code || "",
        salesman: salesmanDoc?._id,
        salesmanCode: salesmanDoc?.code ? String(salesmanDoc.code) : "1",
        items: saleOrderItems,
        netAmount: subTotal,
        totalAmount: subTotal,
        totalDiscountAmount: 0,
        totalQuantity: quantity,
        status: "Start",
        description: `Flipkart Order - ${flipkartOrderId}`,
        grNo: trackingId || "",
        busyApiStatus: "FAILED",
        isActive: true,
      });

      await newSaleOrder.save();
      return newSaleOrder;
    } catch (err) {
      console.error("Error creating matching SaleOrder:", err.message);
      return null;
    }
  }

  /**
   * Run full Order Sync cycle
   */
  static async syncOrders(triggeredBy = "system") {
    const startTime = Date.now();
    const settings = await FlipkartSetting.findOne();

    if (!settings || !settings.isEnabled) {
      return { success: false, message: "Flipkart sync is disabled in settings" };
    }

    try {
      settings.lastSyncStatus = "RUNNING";
      await settings.save();

      let rawOrders = [];
      if (settings.mode !== "simulation") {
        rawOrders = await FlipkartApiService.fetchOrders();
      }

      let createdCount = 0;
      let processedCount = rawOrders.length;
      const detailsList = [];

      for (const order of rawOrders) {
        const result = await this.ingestFlipkartOrderItem(order, triggeredBy);
        if (result.isNew) {
          createdCount++;
          detailsList.push({
            orderId: result.order.flipkartOrderId,
            amount: result.order.total,
            stockUpdates: result.stockUpdates,
          });
        }
      }

      // Update settings
      settings.lastOrderSyncAt = new Date();
      settings.lastSyncStatus = "SUCCESS";
      settings.lastErrorMessage = "";
      settings.totalOrdersSynced = (settings.totalOrdersSynced || 0) + createdCount;
      await settings.save();

      // Log activity
      const log = new FlipkartSyncLog({
        syncType: "ORDER_INGEST",
        status: "SUCCESS",
        recordsProcessed: processedCount,
        ordersCreated: createdCount,
        details: { orders: detailsList },
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      await log.save();

      return {
        success: true,
        ordersProcessed: processedCount,
        ordersCreated: createdCount,
        message: `Successfully synchronized Flipkart orders. ${createdCount} new orders ingested.`,
      };
    } catch (error) {
      settings.lastSyncStatus = "FAILED";
      settings.lastErrorMessage = error.message;
      await settings.save();

      const log = new FlipkartSyncLog({
        syncType: "ORDER_INGEST",
        status: "FAILED",
        recordsProcessed: 0,
        errorMessage: error.message,
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      await log.save();

      throw error;
    }
  }

  /**
   * Push current local stock levels to Flipkart
   */
  static async pushInventoryToFlipkart(triggeredBy = "admin") {
    const startTime = Date.now();
    const settings = await FlipkartSetting.findOne();

    if (!settings || !settings.isEnabled) {
      return { success: false, message: "Flipkart sync is disabled in settings" };
    }

    try {
      // Find all products that have SKU or Flipkart SKU configured
      const products = await Product.find({
        status: "show",
        $or: [
          { flipkartSku: { $exists: true, $ne: "" } },
          { sku: { $exists: true, $ne: "" } },
        ],
      }).limit(500);

      const inventoryUpdates = products.map((p) => ({
        sku: p.flipkartSku || p.sku,
        quantity: p.stock || 0,
        price: p.prices?.price || 0,
      }));

      const apiResult = await FlipkartApiService.updateInventory(inventoryUpdates);

      settings.lastStockSyncAt = new Date();
      await settings.save();

      const log = new FlipkartSyncLog({
        syncType: "INVENTORY_PUSH",
        status: "SUCCESS",
        recordsProcessed: inventoryUpdates.length,
        itemsUpdated: inventoryUpdates.length,
        details: { items: inventoryUpdates.slice(0, 10) },
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      await log.save();

      return {
        success: true,
        totalItemsPushed: inventoryUpdates.length,
        message: `Successfully pushed stock levels for ${inventoryUpdates.length} products to Flipkart.`,
        apiResult,
      };
    } catch (error) {
      const log = new FlipkartSyncLog({
        syncType: "INVENTORY_PUSH",
        status: "FAILED",
        errorMessage: error.message,
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      await log.save();
      throw error;
    }
  }

  /**
   * Process Real-time Webhook from Flipkart
   */
  static async processWebhook(webhookPayload = {}) {
    const startTime = Date.now();
    try {
      const eventType = webhookPayload.eventType || webhookPayload.type || "ORDER_CREATED";
      const orderData = webhookPayload.data || webhookPayload.order || webhookPayload;

      const result = await this.ingestFlipkartOrderItem(orderData, "webhook");

      const log = new FlipkartSyncLog({
        syncType: "WEBHOOK",
        status: "SUCCESS",
        recordsProcessed: 1,
        ordersCreated: result.isNew ? 1 : 0,
        details: { eventType, flipkartOrderId: orderData.orderId || orderData.order_id },
        triggeredBy: "webhook",
        durationMs: Date.now() - startTime,
      });
      await log.save();

      return { success: true, result };
    } catch (error) {
      const log = new FlipkartSyncLog({
        syncType: "WEBHOOK",
        status: "FAILED",
        errorMessage: error.message,
        triggeredBy: "webhook",
        durationMs: Date.now() - startTime,
      });
      await log.save();
      throw error;
    }
  }

  /**
   * Simulate a realistic purchase from Flipkart (For Live Demo / Sandbox Testing)
   */
  static async simulatePurchase(params = {}) {
    const startTime = Date.now();
    const settings = await FlipkartSetting.findOne();

    // Pick an item or product from database if not specified
    let product = null;
    let item = null;

    if (params.productId && mongoose.Types.ObjectId.isValid(params.productId)) {
      item = await Item.findById(params.productId);
      if (!item) product = await Product.findById(params.productId);
    }

    if (!item && !product) {
      item = await Item.findOne({ stock: { $gt: 0 } });
      if (!item) item = await Item.findOne();
      if (!item) {
        product = await Product.findOne({ status: "show", stock: { $gt: 0 } });
        if (!product) product = await Product.findOne({ status: "show" });
      }
    }

    const targetId = item ? item._id : product ? product._id : null;
    const targetTitle = item ? item.name : product ? (product.title?.en || product.title?.name) : "Marketplace Item";
    const targetSku = item ? (item.flipkart?.sku || item.item_code || `FK-${item._id.toString().slice(-4)}`) : product ? (product.flipkartSku || product.sku || `FK-${product._id.toString().slice(-4)}`) : "FK-ITEM-101";
    const targetPrice = item ? (item.sale_price || item.mrp || 499) : product ? (product.prices?.price || 799) : 499;

    const orderId = `OD${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const orderItemId = `ITEM_${Date.now()}`;
    const quantity = Number(params.quantity) || 1;
    const price = targetPrice;

    const simulatedFlipkartOrder = {
      orderId,
      orderItemId,
      sku: targetSku,
      productId: targetId,
      title: targetTitle,
      price,
      quantity,
      orderStatus: "APPROVED",
      paymentType: "Flipkart Prepaid (UPI/Card)",
      buyerName: params.buyerName || "Aakash Verma",
      buyerEmail: params.buyerEmail || "aakash.verma@example.com",
      buyerPhone: params.buyerPhone || "9810123456",
      shippingAddress: {
        addressLine1: params.address || "Flat 402, Green Valley Apartments, Sector 62",
        city: params.city || "Noida",
        pincode: params.zipCode || "201301",
      },
    };

    const ingestResult = await this.ingestFlipkartOrderItem(simulatedFlipkartOrder, "admin");

    // Update settings counters
    if (settings) {
      settings.lastOrderSyncAt = new Date();
      settings.lastSyncStatus = "SUCCESS";
      settings.totalOrdersSynced = (settings.totalOrdersSynced || 0) + 1;
      await settings.save();
    }

    const log = new FlipkartSyncLog({
      syncType: "SIMULATION",
      status: "SUCCESS",
      recordsProcessed: 1,
      ordersCreated: 1,
      details: {
        simulatedOrder: simulatedFlipkartOrder,
        stockUpdates: ingestResult.stockUpdates,
      },
      triggeredBy: "admin",
      durationMs: Date.now() - startTime,
    });
    await log.save();

    return {
      success: true,
      message: `Flipkart simulated purchase completed! Order ${orderId} created, and local stock decremented.`,
      order: ingestResult.order,
      stockUpdates: ingestResult.stockUpdates,
    };
  }
}

module.exports = FlipkartSyncService;
