const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Item = require("../../models/item.model");
const Customer = require("../../models/Customer");
const SaleOrder = require("../../models/saleorder.model");
const SaleType = require("../../models/SaleType.model");
const Salesman = require("../../models/Sales.model");
const CustomerModel = require("../../models/customer.model");
const AmazonSetting = require("../../models/AmazonSetting.model");
const AmazonSyncLog = require("../../models/AmazonSyncLog.model");
const AmazonApiService = require("./amazonApi.service");
const { recordStockMovement } = require("../inventory.service");

/**
 * Amazon Synchronization Engine
 * Handles order ingestion, deduplication, stock deduction, and inventory synchronization
 * Mirrors FlipkartSyncService architecture
 */
class AmazonSyncService {
  /**
   * Helper to find or create an Amazon virtual/system customer
   */
  static async getOrCreateAmazonCustomer(buyerDetails = {}) {
    const email = buyerDetails.email || `amazon.buyer.${Date.now()}@amazon.marketplace`;
    const contact = buyerDetails.contact || buyerDetails.phone || "9999999999";
    const name = buyerDetails.name || "Amazon Customer";

    let customer = await Customer.findOne({ $or: [{ email }, { contact }] });
    if (!customer) {
      customer = new Customer({
        name,
        email,
        phone: contact,
        contact,
        address: buyerDetails.address || "Amazon Marketplace Order",
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
          $or: [
            { item_code: item.sku },
            { "amazon.sku": item.sku },
            { "amazon.asin": item.sku },
          ],
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
            reference_type: "AMAZON_ORDER",
            reference_id: orderId || "",
            channel: "AMAZON",
            source_code: 5,
            source_name: "Item Sale",
            notes: `Amazon order deduction: -${qtyToDeduct} ${matchedItem.unit || 'units'} (Order #${orderId || "N/A"})`,
            updated_by: "Amazon Sync",
          });
        } catch (invErr) {
          console.error("Error logging Amazon stock deduction:", invErr);
        }

        updatedProducts.push({
          itemId: matchedItem._id,
          title: matchedItem.name,
          sku: matchedItem.item_code || matchedItem.amazon?.sku,
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
        product = await Product.findOne({
          $or: [{ sku: item.sku }, { amazonSku: item.sku }, { asin: item.sku }],
        });
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
          sku: product.sku || product.amazonSku,
          previousStock,
          newStock,
          deductedQuantity: qtyToDeduct,
        });
      }
    }

    return updatedProducts;
  }

  /**
   * Ingest a single Amazon order into the local database
   * Handles both raw SP-API order format and simulated orders
   */
  static async ingestAmazonOrderItem(amazonOrder, triggeredBy = "system") {
    const amazonOrderId =
      amazonOrder.AmazonOrderId ||
      amazonOrder.orderId ||
      amazonOrder.order_id;
    const amazonOrderItemId =
      amazonOrder.OrderItemId ||
      amazonOrder.orderItemId ||
      amazonOrderId;

    if (!amazonOrderId) {
      throw new Error("Missing Amazon Order ID");
    }

    // Check if order already exists in our system (Idempotency)
    let existingOrder = await Order.findOne({
      $or: [{ amazonOrderId }, { amazonOrderItemId }],
    });

    if (existingOrder) {
      // Update status if changed
      const newStatus =
        amazonOrder.OrderStatus ||
        amazonOrder.orderStatus ||
        amazonOrder.status ||
        existingOrder.status;
      if (newStatus && existingOrder.amazonOrderStatus !== newStatus) {
        existingOrder.amazonOrderStatus = newStatus;
        if (
          newStatus.toUpperCase() === "CANCELED" ||
          newStatus.toUpperCase() === "CANCELLED"
        ) {
          existingOrder.status = "Cancel";
        } else if (newStatus.toUpperCase() === "SHIPPED") {
          existingOrder.status = "Processing";
        } else if (
          newStatus.toUpperCase() === "DELIVERED" ||
          newStatus.toUpperCase() === "COMPLETED"
        ) {
          existingOrder.status = "Delivered";
        }
        await existingOrder.save();

        // Sync SaleOrder status
        try {
          const matchingSO = await SaleOrder.findOne({
            description: { $regex: amazonOrderId, $options: "i" },
          });
          if (matchingSO) {
            if (
              newStatus.toUpperCase() === "CANCELED" ||
              newStatus.toUpperCase() === "CANCELLED"
            ) {
              matchingSO.status = "Cancelled";
            } else if (newStatus.toUpperCase() === "SHIPPED") {
              matchingSO.status = "Dispatched";
            } else if (
              newStatus.toUpperCase() === "DELIVERED" ||
              newStatus.toUpperCase() === "COMPLETED"
            ) {
              matchingSO.status = "Delivered";
            }
            await matchingSO.save();
          }
        } catch (soUpdateErr) {
          console.error("SaleOrder status sync error:", soUpdateErr.message);
        }
      }
      return { isNew: false, order: existingOrder };
    }

    // Find matching product in local database
    const sku =
      amazonOrder.SellerSKU ||
      amazonOrder.ASIN ||
      amazonOrder.sku ||
      amazonOrder.asin ||
      "";
    let matchedItem = null;
    let matchedProduct = null;

    if (
      amazonOrder.productId &&
      mongoose.Types.ObjectId.isValid(amazonOrder.productId)
    ) {
      matchedItem = await Item.findById(amazonOrder.productId);
      if (!matchedItem)
        matchedProduct = await Product.findById(amazonOrder.productId);
    }

    if (!matchedItem && !matchedProduct && sku) {
      matchedItem = await Item.findOne({
        $or: [
          { item_code: sku },
          { "amazon.sku": sku },
          { "amazon.asin": sku },
          { "flipkart.sku": sku },
        ],
      });
      if (!matchedItem) {
        matchedProduct = await Product.findOne({
          $or: [{ sku: sku }, { amazonSku: sku }, { asin: sku }],
        });
      }
    }

    // If still not matched, fallback to first item
    if (!matchedItem && !matchedProduct) {
      matchedItem = await Item.findOne();
      if (!matchedItem)
        matchedProduct = await Product.findOne({ status: "show" });
    }

    const price = Number(
      amazonOrder.price ||
        amazonOrder.OrderTotal?.Amount ||
        amazonOrder.ItemPrice?.Amount ||
        matchedItem?.sale_price ||
        matchedItem?.mrp ||
        matchedProduct?.prices?.price ||
        499
    );
    const quantity = Number(
      amazonOrder.QuantityOrdered || amazonOrder.quantity || 1
    );
    const itemTitle =
      matchedItem?.name ||
      matchedProduct?.title?.en ||
      matchedProduct?.title?.name ||
      amazonOrder.Title ||
      amazonOrder.title ||
      "Amazon Marketplace Product";
    const rawImage =
      matchedItem?.image ||
      matchedProduct?.image ||
      (amazonOrder.image ? [amazonOrder.image] : []);
    const itemImage = Array.isArray(rawImage)
      ? rawImage.map((img) =>
          typeof img === "object" ? img.url || img.path : img
        )
      : [rawImage];

    const cartItem = {
      id: matchedItem
        ? matchedItem._id.toString()
        : matchedProduct
        ? matchedProduct._id.toString()
        : `amz_${Date.now()}`,
      title: itemTitle,
      slug:
        matchedProduct?.slug ||
        `amz-item-${matchedItem?._id || Date.now()}`,
      image: itemImage,
      originalPrice: Number(
        matchedItem?.mrp ||
          matchedProduct?.prices?.originalPrice ||
          price
      ),
      price: price,
      quantity: quantity,
      itemTotal: price * quantity,
      variant: {
        sku:
          sku ||
          matchedItem?.item_code ||
          matchedItem?.amazon?.sku ||
          matchedProduct?.sku ||
          "",
      },
    };

    // Buyer Information
    const buyerInfo = {
      name:
        amazonOrder.BuyerName ||
        amazonOrder.buyerName ||
        amazonOrder.customerName ||
        "Amazon Buyer",
      email:
        amazonOrder.BuyerEmail ||
        amazonOrder.buyerEmail ||
        `buyer_${amazonOrderId}@amazon.in`,
      contact:
        amazonOrder.buyerPhone ||
        amazonOrder.Phone ||
        amazonOrder.contact ||
        "9876543210",
      address:
        amazonOrder.ShippingAddress?.AddressLine1 ||
        amazonOrder.shippingAddress?.addressLine1 ||
        amazonOrder.address ||
        "Amazon Delivery Address",
      city:
        amazonOrder.ShippingAddress?.City ||
        amazonOrder.shippingAddress?.city ||
        amazonOrder.city ||
        "New Delhi",
      country: "India",
      zipCode:
        amazonOrder.ShippingAddress?.PostalCode ||
        amazonOrder.shippingAddress?.pincode ||
        amazonOrder.zipCode ||
        "110001",
    };

    const customer = await this.getOrCreateAmazonCustomer(buyerInfo);

    const subTotal = price * quantity;
    const shippingCost = Number(
      amazonOrder.ShippingPrice?.Amount || amazonOrder.shippingCharge || 0
    );
    const discount = Number(
      amazonOrder.PromotionDiscount?.Amount || amazonOrder.discount || 0
    );
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
      paymentMethod:
        amazonOrder.PaymentMethod ||
        amazonOrder.paymentType ||
        "Amazon Marketplace Payment",
      status: "Processing",
      source: "amazon",
      amazonOrderId,
      amazonOrderItemId,
      amazonTrackingId:
        amazonOrder.trackingId || `AMZTRK${Date.now()}`,
      amazonOrderStatus:
        amazonOrder.OrderStatus || amazonOrder.orderStatus || "Unshipped",
      amazonAsin: sku,
    });

    await newOrder.save();

    // Also create matching SaleOrder so it appears in /sale-order page
    let saleOrder = null;
    try {
      saleOrder = await this.createMatchingSaleOrder({
        amazonOrderId,
        amazonOrderItemId,
        matchedItem,
        matchedProduct,
        price,
        quantity,
        buyerInfo,
        trackingId: amazonOrder.trackingId,
      });
    } catch (soErr) {
      console.error("SaleOrder creation error:", soErr.message);
    }

    // Deduct stock locally if setting enabled
    const settings = await AmazonSetting.findOne();
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
  static async createMatchingSaleOrder({
    amazonOrderId,
    amazonOrderItemId,
    matchedItem,
    matchedProduct,
    price,
    quantity,
    buyerInfo,
    trackingId,
  }) {
    try {
      // Check if SaleOrder already exists for this amazonOrderId
      const existingSaleOrder = await SaleOrder.findOne({
        $or: [
          { description: { $regex: amazonOrderId, $options: "i" } },
          {
            voucherNo: {
              $regex: amazonOrderId.slice(-6),
              $options: "i",
            },
          },
        ],
      });

      if (existingSaleOrder) {
        return existingSaleOrder;
      }

      // Find active SaleType & Salesman
      const saleTypeDoc =
        (await SaleType.findOne({ status: "active" })) ||
        (await SaleType.findOne());
      const salesmanDoc =
        (await Salesman.findOne({ name: "General" })) ||
        (await Salesman.findOne());

      // Find or create customer in customer.model collection
      let customerDoc = await CustomerModel.findOne({
        $or: [
          { email: buyerInfo.email },
          { mobile: buyerInfo.contact },
        ],
      });

      if (!customerDoc) {
        customerDoc = new CustomerModel({
          name: buyerInfo.name || "Amazon Customer",
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
      const itemName =
        matchedItem?.name ||
        matchedProduct?.title?.en ||
        matchedProduct?.title?.name ||
        "Amazon Marketplace Product";
      let itemImg = "";
      const rawImg = matchedItem?.image || matchedProduct?.image;
      if (Array.isArray(rawImg) && rawImg.length > 0) {
        const first = rawImg[0];
        itemImg =
          typeof first === "object"
            ? first?.url || first?.path || ""
            : String(first);
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
          description: `Amazon Order Item ${
            amazonOrderItemId || amazonOrderId
          }`,
        },
      ];

      const newSaleOrder = new SaleOrder({
        voucherNo: `SO-AMZ-${
          amazonOrderId
            ? amazonOrderId.slice(-6).toUpperCase()
            : Math.floor(1000 + Math.random() * 9000)
        }`,
        saleType: saleTypeDoc?._id,
        saleTypeCode: saleTypeDoc?.code ? String(saleTypeDoc.code) : "1",
        matCentre: "MAIN",
        date: new Date(),
        customer: customerDoc._id,
        customerCode: customerDoc.code || "",
        salesman: salesmanDoc?._id,
        salesmanCode: salesmanDoc?.code
          ? String(salesmanDoc.code)
          : "1",
        items: saleOrderItems,
        netAmount: subTotal,
        totalAmount: subTotal,
        totalDiscountAmount: 0,
        totalQuantity: quantity,
        status: "Start",
        description: `Amazon Order - ${amazonOrderId}`,
        grNo: trackingId || "",
        busyApiStatus: "FAILED",
        isActive: true,
      });

      await newSaleOrder.save();
      return newSaleOrder;
    } catch (err) {
      console.error(
        "Error creating matching SaleOrder:",
        err.message
      );
      return null;
    }
  }

  /**
   * Run full Order Sync cycle
   */
  static async syncOrders(triggeredBy = "system") {
    const startTime = Date.now();
    const settings = await AmazonSetting.findOne();

    if (!settings || !settings.isEnabled) {
      return {
        success: false,
        message: "Amazon sync is disabled in settings",
      };
    }

    try {
      settings.lastSyncStatus = "RUNNING";
      await settings.save();

      let rawOrders = [];
      if (settings.mode !== "simulation") {
        rawOrders = await AmazonApiService.fetchOrders();

        // For each order, fetch order items to get detailed info
        const enrichedOrders = [];
        for (const order of rawOrders) {
          try {
            const orderItems = await AmazonApiService.getOrderItems(
              order.AmazonOrderId
            );
            for (const item of orderItems) {
              enrichedOrders.push({
                ...order,
                ...item,
                orderId: order.AmazonOrderId,
                orderItemId: item.OrderItemId,
              });
            }
          } catch (itemErr) {
            // If we can't get items, still try to ingest the order header
            enrichedOrders.push({
              ...order,
              orderId: order.AmazonOrderId,
            });
          }
        }
        rawOrders = enrichedOrders;
      }

      let createdCount = 0;
      let processedCount = rawOrders.length;
      const detailsList = [];

      for (const order of rawOrders) {
        const result = await this.ingestAmazonOrderItem(
          order,
          triggeredBy
        );
        if (result.isNew) {
          createdCount++;
          detailsList.push({
            orderId: result.order.amazonOrderId,
            amount: result.order.total,
            stockUpdates: result.stockUpdates,
          });
        }
      }

      // Update settings
      settings.lastOrderSyncAt = new Date();
      settings.lastSyncStatus = "SUCCESS";
      settings.lastErrorMessage = "";
      settings.totalOrdersSynced =
        (settings.totalOrdersSynced || 0) + createdCount;
      await settings.save();

      // Log activity
      const log = new AmazonSyncLog({
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
        message: `Successfully synchronized Amazon orders. ${createdCount} new orders ingested.`,
      };
    } catch (error) {
      settings.lastSyncStatus = "FAILED";
      settings.lastErrorMessage = error.message;
      await settings.save();

      const log = new AmazonSyncLog({
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
   * Push current local stock levels to Amazon
   */
  static async pushInventoryToAmazon(triggeredBy = "admin") {
    const startTime = Date.now();
    const settings = await AmazonSetting.findOne();

    if (!settings || !settings.isEnabled) {
      return {
        success: false,
        message: "Amazon sync is disabled in settings",
      };
    }

    try {
      // Find all products that have Amazon SKU or ASIN configured
      const items = await Item.find({
        $or: [
          { "amazon.sku": { $exists: true, $ne: "" } },
          { "amazon.asin": { $exists: true, $ne: "" } },
        ],
      }).limit(500);

      const inventoryUpdates = items.map((item) => ({
        sku: item.amazon?.sku || item.item_code,
        quantity: item.stock || 0,
        price: item.sale_price || item.mrp || 0,
      }));

      // Also check Product collection
      const products = await Product.find({
        status: "show",
        $or: [
          { amazonSku: { $exists: true, $ne: "" } },
          { sku: { $exists: true, $ne: "" } },
        ],
      }).limit(500);

      const productUpdates = products.map((p) => ({
        sku: p.amazonSku || p.sku,
        quantity: p.stock || 0,
        price: p.prices?.price || 0,
      }));

      const allUpdates = [...inventoryUpdates, ...productUpdates];
      const apiResult = await AmazonApiService.updateInventory(allUpdates);

      settings.lastStockSyncAt = new Date();
      await settings.save();

      const log = new AmazonSyncLog({
        syncType: "INVENTORY_PUSH",
        status: "SUCCESS",
        recordsProcessed: allUpdates.length,
        itemsUpdated: allUpdates.length,
        details: { items: allUpdates.slice(0, 10) },
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      await log.save();

      return {
        success: true,
        totalItemsPushed: allUpdates.length,
        message: `Successfully pushed stock levels for ${allUpdates.length} products to Amazon.`,
        apiResult,
      };
    } catch (error) {
      const log = new AmazonSyncLog({
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
   * Process Webhook / SNS Notification from Amazon
   */
  static async processWebhook(webhookPayload = {}) {
    const startTime = Date.now();
    try {
      const eventType =
        webhookPayload.NotificationType ||
        webhookPayload.eventType ||
        webhookPayload.type ||
        "ORDER_CHANGE";
      const orderData =
        webhookPayload.Payload?.OrderChangeNotification ||
        webhookPayload.data ||
        webhookPayload.order ||
        webhookPayload;

      const result = await this.ingestAmazonOrderItem(
        orderData,
        "webhook"
      );

      const log = new AmazonSyncLog({
        syncType: "WEBHOOK",
        status: "SUCCESS",
        recordsProcessed: 1,
        ordersCreated: result.isNew ? 1 : 0,
        details: {
          eventType,
          amazonOrderId:
            orderData.AmazonOrderId ||
            orderData.orderId ||
            orderData.order_id,
        },
        triggeredBy: "webhook",
        durationMs: Date.now() - startTime,
      });
      await log.save();

      return { success: true, result };
    } catch (error) {
      const log = new AmazonSyncLog({
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
   * Simulate a realistic purchase from Amazon (For Live Demo / Sandbox Testing)
   */
  static async simulatePurchase(params = {}) {
    const startTime = Date.now();
    const settings = await AmazonSetting.findOne();

    // Pick an item or product from database if not specified
    let product = null;
    let item = null;

    if (
      params.productId &&
      mongoose.Types.ObjectId.isValid(params.productId)
    ) {
      item = await Item.findById(params.productId);
      if (!item) product = await Product.findById(params.productId);
    }

    if (!item && !product) {
      item = await Item.findOne({ stock: { $gt: 0 } });
      if (!item) item = await Item.findOne();
      if (!item) {
        product = await Product.findOne({
          status: "show",
          stock: { $gt: 0 },
        });
        if (!product)
          product = await Product.findOne({ status: "show" });
      }
    }

    const targetId = item
      ? item._id
      : product
      ? product._id
      : null;
    const targetTitle = item
      ? item.name
      : product
      ? product.title?.en || product.title?.name
      : "Marketplace Item";
    const targetSku = item
      ? item.amazon?.sku ||
        item.item_code ||
        `AMZ-${item._id.toString().slice(-4)}`
      : product
      ? product.amazonSku ||
        product.sku ||
        `AMZ-${product._id.toString().slice(-4)}`
      : "AMZ-ITEM-101";
    const targetPrice = item
      ? item.sale_price || item.mrp || 499
      : product
      ? product.prices?.price || 799
      : 499;

    const orderId = `${Date.now()}-${Math.floor(
      Math.random() * 9000000 + 1000000
    )}`;
    const orderItemId = `${Date.now()}${Math.floor(
      Math.random() * 900 + 100
    )}`;
    const quantity = Number(params.quantity) || 1;
    const price = targetPrice;

    const simulatedAmazonOrder = {
      AmazonOrderId: orderId,
      OrderItemId: orderItemId,
      SellerSKU: targetSku,
      ASIN: targetSku,
      productId: targetId,
      Title: targetTitle,
      title: targetTitle,
      price,
      QuantityOrdered: quantity,
      quantity,
      OrderStatus: "Unshipped",
      orderStatus: "Unshipped",
      PaymentMethod: "Amazon Pay (UPI/Card)",
      paymentType: "Amazon Pay (UPI/Card)",
      BuyerName: params.buyerName || "Rahul Sharma",
      buyerName: params.buyerName || "Rahul Sharma",
      BuyerEmail:
        params.buyerEmail || "rahul.sharma@example.com",
      buyerEmail:
        params.buyerEmail || "rahul.sharma@example.com",
      buyerPhone: params.buyerPhone || "9810987654",
      ShippingAddress: {
        AddressLine1:
          params.address ||
          "Block C-12, Vasant Kunj, South Delhi",
        City: params.city || "New Delhi",
        PostalCode: params.zipCode || "110070",
      },
      shippingAddress: {
        addressLine1:
          params.address ||
          "Block C-12, Vasant Kunj, South Delhi",
        city: params.city || "New Delhi",
        pincode: params.zipCode || "110070",
      },
    };

    const ingestResult = await this.ingestAmazonOrderItem(
      simulatedAmazonOrder,
      "admin"
    );

    // Update settings counters
    if (settings) {
      settings.lastOrderSyncAt = new Date();
      settings.lastSyncStatus = "SUCCESS";
      settings.totalOrdersSynced =
        (settings.totalOrdersSynced || 0) + 1;
      await settings.save();
    }

    const log = new AmazonSyncLog({
      syncType: "SIMULATION",
      status: "SUCCESS",
      recordsProcessed: 1,
      ordersCreated: 1,
      details: {
        simulatedOrder: simulatedAmazonOrder,
        stockUpdates: ingestResult.stockUpdates,
      },
      triggeredBy: "admin",
      durationMs: Date.now() - startTime,
    });
    await log.save();

    return {
      success: true,
      message: `Amazon simulated purchase completed! Order ${orderId} created, and local stock decremented.`,
      order: ingestResult.order,
      stockUpdates: ingestResult.stockUpdates,
    };
  }
}

module.exports = AmazonSyncService;
