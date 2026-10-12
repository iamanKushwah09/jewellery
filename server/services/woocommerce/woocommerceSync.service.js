const Order = require("../../models/Order");
const SaleOrder = require("../../models/saleorder.model");
const CustomerModel = require("../../models/customer.model");
const Item = require("../../models/item.model");
const Product = require("../../models/Product");
const SaleType = require("../../models/SaleType.model");
const Salesman = require("../../models/Salesman");
const WooCommerceSetting = require("../../models/WooCommerceSetting.model");
const WooCommerceApiService = require("./woocommerceApi.service");
const busyApi = require("../../utils/busyApi");

/**
 * WooCommerce Order Synchronization Service
 * Ingests orders from WooCommerce REST API into local Orders, Customer models, and Busy ERP
 */
class WooCommerceSyncService {
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
   * Ingest a single WooCommerce order into our system
   */
  static async ingestWooCommerceOrder(wcOrder, triggeredBy = "system") {
    const wcOrderId = String(wcOrder.id);
    const orderNumber = String(wcOrder.number || wcOrderId);

    if (!wcOrderId) {
      throw new Error("Missing WooCommerce Order ID");
    }

    // Check duplicate (idempotency)
    let existingOrder = await Order.findOne({
      $or: [
        { woocommerceOrderId: wcOrderId },
        { "user_info.woocommerceOrderId": wcOrderId },
      ],
    });

    if (existingOrder) {
      if (wcOrder.status === "completed" && existingOrder.status !== "Delivered") {
        existingOrder.status = "Delivered";
        await existingOrder.save();
      }
      return { isNew: false, order: existingOrder };
    }

    // Customer parsing
    const billing = wcOrder.billing || {};
    const shipping = wcOrder.shipping || {};

    const buyerName =
      [billing.first_name || shipping.first_name, billing.last_name || shipping.last_name]
        .filter(Boolean)
        .join(" ") || "WooCommerce Customer";

    const buyerEmail = billing.email || `woocommerce_${wcOrderId}@example.com`;
    const buyerPhone = billing.phone || shipping.phone || "9876543210";
    const buyerAddress =
      [billing.address_1 || shipping.address_1, billing.address_2 || shipping.address_2]
        .filter(Boolean)
        .join(", ") || "WooCommerce Customer Address";
    const buyerCity = billing.city || shipping.city || "Ahmedabad";
    const buyerState = billing.state || shipping.state || "Gujarat";
    const buyerZip = billing.postcode || shipping.postcode || "380001";

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
    const lineItems = wcOrder.line_items || [];
    const cartItems = [];
    let subTotal = 0;

    for (const item of lineItems) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity, 10) || 1;
      const lineTotal = parseFloat(item.total) || itemPrice * itemQty;
      subTotal += lineTotal;

      const { matchedItem, matchedProduct } = await this.findMatchingProductOrItem(
        item.sku,
        item.name
      );

      cartItems.push({
        _id: matchedProduct?._id || matchedItem?._id || `wc-item-${item.id}`,
        title: item.name || "WooCommerce Product",
        price: itemPrice,
        originalPrice: itemPrice,
        quantity: itemQty,
        itemTotal: lineTotal,
        image: matchedProduct?.image?.[0]?.url || matchedItem?.image || "",
        sku: item.sku || "WOO-SKU",
      });
    }

    const shippingCost = parseFloat(wcOrder.shipping_total || 0);
    const totalDiscount = parseFloat(wcOrder.discount_total || 0);
    const grandTotal = parseFloat(wcOrder.total) || subTotal + shippingCost - totalDiscount;

    // Map order status
    let orderStatus = "Processing";
    if (wcOrder.status === "completed") {
      orderStatus = "Delivered";
    } else if (wcOrder.status === "cancelled" || wcOrder.status === "failed") {
      orderStatus = "Cancel";
    }

    const newOrder = new Order({
      user: customerDoc._id,
      cart: cartItems,
      user_info: {
        name: buyerName,
        email: buyerEmail,
        contact: buyerPhone,
        address: buyerAddress,
        city: buyerCity,
        country: billing.country || "India",
        zipCode: buyerZip,
        woocommerceOrderId: wcOrderId,
      },
      subTotal,
      shippingCost,
      discount: totalDiscount,
      total: grandTotal,
      grandTotal,
      paymentMethod: wcOrder.payment_method_title || "WooCommerce Online Payment",
      status: orderStatus,
      source: "woocommerce",
      woocommerceOrderId: wcOrderId,
    });

    await newOrder.save();

    // Create matching SaleOrder for ERP views
    let saleOrder = null;
    try {
      saleOrder = await this.createMatchingSaleOrder({
        wcOrderId,
        orderNumber,
        customerDoc,
        cartItems,
        grandTotal,
        subTotal,
      });
    } catch (soErr) {
      console.error("WooCommerce SaleOrder creation error:", soErr.message);
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
    wcOrderId,
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
    const settings = (await WooCommerceSetting.findOne()) || {};

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
      description: `WooCommerce Order #${orderNumber}`,
    }));

    const newSaleOrder = new SaleOrder({
      voucherNo: `SO-WC-${orderNumber}`,
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
      description: `WooCommerce Order - #${orderNumber} (${wcOrderId})`,
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
        PartyName: settings.busyPartyName || "WOOCOMMERCE CUSTOMERS",
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
      console.warn("Busy ERP push notice for WooCommerce order:", busyErr.message);
    }

    return newSaleOrder;
  }

  /**
   * Run full WooCommerce Order Sync Cycle
   */
  static async syncOrders(triggeredBy = "system") {
    const settings = await WooCommerceSetting.findOne();
    if (!settings || !settings.isEnabled) {
      return {
        success: false,
        message: "WooCommerce sync is disabled in settings",
      };
    }

    try {
      settings.lastSyncStatus = "RUNNING";
      await settings.save();

      const rawOrders = await WooCommerceApiService.fetchOrders();
      let createdCount = 0;
      let processedCount = 0;

      for (const order of rawOrders) {
        processedCount++;
        try {
          const result = await this.ingestWooCommerceOrder(order, triggeredBy);
          if (result.isNew) createdCount++;
        } catch (err) {
          console.error(`Error processing WooCommerce order ${order.id}:`, err.message);
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
        message: `WooCommerce sync completed. ${createdCount} new orders created out of ${processedCount} fetched.`,
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

module.exports = WooCommerceSyncService;
