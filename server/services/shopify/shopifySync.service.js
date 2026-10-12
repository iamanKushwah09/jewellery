const Order = require("../../models/Order");
const SaleOrder = require("../../models/saleorder.model");
const CustomerModel = require("../../models/customer.model");
const Item = require("../../models/item.model");
const Product = require("../../models/Product");
const SaleType = require("../../models/SaleType.model");
const Salesman = require("../../models/Salesman");
const ShopifySetting = require("../../models/ShopifySetting.model");
const ShopifyApiService = require("./shopifyApi.service");
const busyApi = require("../../utils/busyApi");

/**
 * Shopify Order Synchronization Service
 * Ingests orders from Shopify Admin API into local Orders, Customer models, and Busy ERP
 */
class ShopifySyncService {
  /**
   * Look up matching Item or Product by SKU / Barcode / Title
   */
  static async findMatchingProductOrItem(sku, title) {
    let matchedItem = null;
    let matchedProduct = null;

    if (sku) {
      matchedItem = await Item.findOne({
        $or: [{ code: sku }, { print_name: sku }, { name: sku }],
      });
      matchedProduct = await Product.findOne({
        $or: [{ sku: sku }, { barcode: sku }, { "variants.sku": sku }],
      });
    }

    if (!matchedItem && !matchedProduct && title) {
      matchedItem = await Item.findOne({
        name: { $regex: title.substring(0, 20), $options: "i" },
      });
      matchedProduct = await Product.findOne({
        $or: [
          { "title.en": { $regex: title.substring(0, 20), $options: "i" } },
          { "title.name": { $regex: title.substring(0, 20), $options: "i" } },
        ],
      });
    }

    return { matchedItem, matchedProduct };
  }

  /**
   * Ingest a single Shopify order into our system
   */
  static async ingestShopifyOrder(shopifyOrder, triggeredBy = "system") {
    const shopifyOrderId = String(shopifyOrder.id || shopifyOrder.order_number);
    const orderNumber = String(shopifyOrder.order_number || shopifyOrder.name || shopifyOrderId);

    if (!shopifyOrderId) {
      throw new Error("Missing Shopify Order ID");
    }

    // Check duplicate (idempotency)
    let existingOrder = await Order.findOne({
      $or: [
        { shopifyOrderId },
        { "user_info.shopifyOrderId": shopifyOrderId },
      ],
    });

    if (existingOrder) {
      // Update financial/fulfillment status if changed
      const shopifyFulfillment = shopifyOrder.fulfillment_status;
      if (shopifyFulfillment === "fulfilled" && existingOrder.status !== "Delivered") {
        existingOrder.status = "Delivered";
        await existingOrder.save();
      }
      return { isNew: false, order: existingOrder };
    }

    // Customer parsing
    const custRaw = shopifyOrder.customer || {};
    const shipAddr = shopifyOrder.shipping_address || shopifyOrder.billing_address || {};

    const buyerName =
      [shipAddr.first_name || custRaw.first_name, shipAddr.last_name || custRaw.last_name]
        .filter(Boolean)
        .join(" ") ||
      shipAddr.name ||
      "Shopify Customer";

    const buyerEmail = custRaw.email || shopifyOrder.email || `shopify_${shopifyOrderId}@example.com`;
    const buyerPhone = shipAddr.phone || custRaw.phone || "9876543210";
    const buyerAddress = [shipAddr.address1, shipAddr.address2].filter(Boolean).join(", ") || "Shopify Customer Address";
    const buyerCity = shipAddr.city || "Bengaluru";
    const buyerState = shipAddr.province || "Karnataka";
    const buyerZip = shipAddr.zip || "560001";

    // Upsert customer in customer.model
    let customerDoc = await CustomerModel.findOne({
      $or: [{ email: buyerEmail }, { mobile: buyerPhone }],
    });

    if (!customerDoc) {
      customerDoc = new CustomerModel({
        name: buyerName,
        email: buyerEmail,
        mobile: buyerPhone,
        address: buyerAddress,
        city_id: buyerCity,
        pincode: buyerZip,
        is_active: true,
      });
      await customerDoc.save();
    }

    // Map line items
    const lineItems = shopifyOrder.line_items || [];
    const cartItems = [];
    let subTotal = 0;

    for (const item of lineItems) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity, 10) || 1;
      const lineTotal = itemPrice * itemQty;
      subTotal += lineTotal;

      const { matchedItem, matchedProduct } = await this.findMatchingProductOrItem(
        item.sku,
        item.title
      );

      cartItems.push({
        _id: matchedProduct?._id || matchedItem?._id || `shpfy-item-${item.id}`,
        title: item.title || "Shopify Product",
        price: itemPrice,
        originalPrice: itemPrice,
        quantity: itemQty,
        itemTotal: lineTotal,
        image: matchedProduct?.image?.[0]?.url || matchedItem?.image || "",
        sku: item.sku || "SHOPIFY-SKU",
      });
    }

    const shippingCost = parseFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0);
    const totalDiscount = parseFloat(shopifyOrder.total_discounts || 0);
    const grandTotal = parseFloat(shopifyOrder.total_price) || subTotal + shippingCost - totalDiscount;

    // Create Order in Order collection
    const newOrder = new Order({
      user: customerDoc._id,
      cart: cartItems,
      user_info: {
        name: buyerName,
        email: buyerEmail,
        contact: buyerPhone,
        address: buyerAddress,
        city: buyerCity,
        country: shipAddr.country || "India",
        zipCode: buyerZip,
        shopifyOrderId,
      },
      subTotal,
      shippingCost,
      discount: totalDiscount,
      total: grandTotal,
      grandTotal,
      paymentMethod: shopifyOrder.gateway || "Shopify Online Payment",
      status: shopifyOrder.fulfillment_status === "fulfilled" ? "Delivered" : "Processing",
      source: "shopify",
      shopifyOrderId,
    });

    await newOrder.save();

    // Create matching SaleOrder for ERP views
    let saleOrder = null;
    try {
      saleOrder = await this.createMatchingSaleOrder({
        shopifyOrderId,
        orderNumber,
        customerDoc,
        cartItems,
        grandTotal,
        subTotal,
      });
    } catch (soErr) {
      console.error("Shopify SaleOrder creation error:", soErr.message);
    }

    return {
      isNew: true,
      order: newOrder,
      saleOrder,
    };
  }

  /**
   * Create corresponding SaleOrder in ERP collection
   */
  static async createMatchingSaleOrder({
    shopifyOrderId,
    orderNumber,
    customerDoc,
    cartItems,
    grandTotal,
    subTotal,
  }) {
    const saleTypeDoc =
      (await SaleType.findOne({ status: "active" })) || (await SaleType.findOne());
    const salesmanDoc =
      (await Salesman.findOne({ name: "General" })) || (await Salesman.findOne());
    const settings = (await ShopifySetting.findOne()) || {};

    const saleOrderItems = cartItems.map((ci) => ({
      itemId: ci._id,
      name: ci.title,
      image: ci.image,
      listPrice: ci.price,
      price: ci.price,
      quantity: ci.quantity,
      unit: "PCS",
      conversion_factor: 1,
      discount: 0,
      totalDiscount: 0,
      amount: ci.itemTotal,
      description: `Shopify Order #${orderNumber}`,
    }));

    const newSaleOrder = new SaleOrder({
      voucherNo: `SO-SHP-${orderNumber}`,
      saleType: saleTypeDoc?._id,
      saleTypeCode: saleTypeDoc?.code ? String(saleTypeDoc.code) : "1",
      matCentre: settings.busyMatCenter || "MAIN",
      date: new Date(),
      customer: customerDoc._id,
      customerCode: customerDoc.code || "",
      salesman: salesmanDoc?._id,
      salesmanCode: salesmanDoc?.code ? String(salesmanDoc.code) : "1",
      items: saleOrderItems,
      netAmount: grandTotal,
      totalAmount: grandTotal,
      totalDiscountAmount: 0,
      totalQuantity: cartItems.reduce((acc, c) => acc + c.quantity, 0),
      status: "Start",
      description: `Shopify Order - #${orderNumber} (${shopifyOrderId})`,
      grNo: "",
      busyApiStatus: "PENDING",
      isActive: true,
    });

    await newSaleOrder.save();

    // Push to Busy ERP if enabled
    try {
      const busyRes = await busyApi.createSaleOrder({
        VchSeries: settings.busySeries || "MAIN",
        Date: new Date().toISOString().split("T")[0],
        VchType: settings.busyVchType || 9,
        SaleType: settings.busySaleType || "L/GST 18%",
        PartyName: settings.busyPartyName || "SHOPIFY CUSTOMERS",
        MatCentre: settings.busyMatCenter || "Main Store",
        Items: saleOrderItems.map((item) => ({
          ItemName: item.name,
          Qty: item.quantity,
          Unit: item.unit || "PCS",
          Price: item.price,
          Amount: item.amount,
        })),
      });

      if (busyRes && busyRes.success) {
        newSaleOrder.busyApiStatus = "SUCCESS";
        await newSaleOrder.save();
      }
    } catch (busyErr) {
      console.warn("Busy ERP push notice for Shopify order:", busyErr.message);
    }

    return newSaleOrder;
  }

  /**
   * Run full Shopify Order Sync Cycle
   */
  static async syncOrders(triggeredBy = "system") {
    const settings = await ShopifySetting.findOne();
    if (!settings || !settings.isEnabled) {
      return {
        success: false,
        message: "Shopify sync is disabled in settings",
      };
    }

    try {
      settings.lastSyncStatus = "RUNNING";
      await settings.save();

      const rawOrders = await ShopifyApiService.fetchOrders();
      let createdCount = 0;
      let processedCount = 0;

      for (const order of rawOrders) {
        processedCount++;
        try {
          const result = await this.ingestShopifyOrder(order, triggeredBy);
          if (result.isNew) createdCount++;
        } catch (err) {
          console.error(`Error processing Shopify order ${order.id}:`, err.message);
        }
      }

      settings.lastSyncStatus = "SUCCESS";
      settings.lastOrderSyncAt = new Date();
      settings.lastErrorMessage = "";
      settings.totalOrdersSynced = (settings.totalOrdersSynced || 0) + createdCount;
      await settings.save();

      return {
        success: true,
        processed: processedCount,
        created: createdCount,
        message: `Shopify sync completed. ${createdCount} new orders created out of ${processedCount} fetched.`,
      };
    } catch (error) {
      settings.lastSyncStatus = "FAILED";
      settings.lastErrorMessage = error.message;
      await settings.save();

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ShopifySyncService;
