const axios = require("axios");
const WooCommerceSetting = require("../../models/WooCommerceSetting.model");

/**
 * WooCommerce REST API Client
 * Connects to WooCommerce REST API v3 using Consumer Key and Consumer Secret
 */
class WooCommerceApiService {
  /**
   * Normalize WordPress/WooCommerce store URL
   */
  static normalizeStoreUrl(storeUrl) {
    if (!storeUrl) return "";
    let clean = storeUrl.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    return clean.replace(/\/+$/, "");
  }

  /**
   * Test connection with configured WooCommerce credentials
   */
  static async testConnection() {
    const settings = await WooCommerceSetting.findOne();
    if (!settings) {
      throw new Error("WooCommerce settings not found in database");
    }

    if (settings.mode === "simulation") {
      return {
        success: true,
        mode: "simulation",
        message:
          "Simulation mode active. WooCommerce sync service is fully operational and ready to ingest test orders.",
      };
    }

    if (!settings.storeUrl || !settings.consumerKey || !settings.consumerSecret) {
      throw new Error("Store URL, Consumer Key, and Consumer Secret are required to test connection");
    }

    const cleanUrl = WooCommerceApiService.normalizeStoreUrl(settings.storeUrl);
    const apiVersion = settings.apiVersion || "wc/v3";
    const endpoint = `${cleanUrl}/wp-json/${apiVersion}/orders`;

    try {
      const response = await axios.get(endpoint, {
        params: { per_page: 1 },
        auth: {
          username: settings.consumerKey,
          password: settings.consumerSecret,
        },
        timeout: 15000,
      });

      return {
        success: true,
        mode: "production",
        storeUrl: cleanUrl,
        message: `Successfully connected to WooCommerce store at ${cleanUrl}!`,
      };
    } catch (error) {
      const status = error.response?.status;
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;

      throw new Error(
        `WooCommerce Connection Failed (${status || "Network Error"}): ${errorMsg}`
      );
    }
  }

  /**
   * Fetch recent orders from WooCommerce
   * @param {Object} options - Filter options
   */
  static async fetchOrders(options = {}) {
    const settings = await WooCommerceSetting.findOne();
    if (!settings) {
      throw new Error("WooCommerce settings not configured");
    }

    if (settings.mode === "simulation") {
      return WooCommerceApiService.generateSimulationOrders();
    }

    if (!settings.storeUrl || !settings.consumerKey || !settings.consumerSecret) {
      throw new Error("WooCommerce credentials not configured");
    }

    const cleanUrl = WooCommerceApiService.normalizeStoreUrl(settings.storeUrl);
    const apiVersion = settings.apiVersion || "wc/v3";
    const endpoint = `${cleanUrl}/wp-json/${apiVersion}/orders`;

    const params = {
      per_page: options.perPage || 50,
      status: options.status || "processing,completed,on-hold",
      order: "desc",
      orderby: "date",
    };

    if (options.after) {
      params.after = options.after;
    } else if (settings.lastOrderSyncAt) {
      const bufferTime = new Date(new Date(settings.lastOrderSyncAt).getTime() - 10 * 60 * 1000);
      params.after = bufferTime.toISOString();
    }

    try {
      const response = await axios.get(endpoint, {
        params,
        auth: {
          username: settings.consumerKey,
          password: settings.consumerSecret,
        },
        timeout: 20000,
      });

      return response.data || [];
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch orders from WooCommerce: ${errMsg}`);
    }
  }

  /**
   * Fetch single order by ID
   */
  static async getOrder(orderId) {
    const settings = await WooCommerceSetting.findOne();
    if (!settings) throw new Error("WooCommerce settings not found");

    if (settings.mode === "simulation") {
      return WooCommerceApiService.generateSimulationOrders()[0];
    }

    const cleanUrl = WooCommerceApiService.normalizeStoreUrl(settings.storeUrl);
    const apiVersion = settings.apiVersion || "wc/v3";
    const response = await axios.get(`${cleanUrl}/wp-json/${apiVersion}/orders/${orderId}`, {
      auth: {
        username: settings.consumerKey,
        password: settings.consumerSecret,
      },
      timeout: 15000,
    });

    return response.data;
  }

  /**
   * Mock data generator for simulation mode
   */
  static generateSimulationOrders() {
    const now = new Date();
    const orderNum = Math.floor(2000 + Math.random() * 8000);
    const orderId = `SIM-WC-${Date.now()}`;

    return [
      {
        id: orderId,
        number: String(orderNum),
        status: "processing",
        currency: "INR",
        date_created: now.toISOString(),
        total: "3199.00",
        total_tax: "342.75",
        shipping_total: "100.00",
        discount_total: "0.00",
        payment_method_title: "Razorpay / UPI / Credit Card",
        billing: {
          first_name: "Amit",
          last_name: "Patel",
          company: "",
          address_1: "Shop 12, Commercial Complex",
          address_2: "C.G. Road",
          city: "Ahmedabad",
          state: "Gujarat",
          postcode: "380009",
          country: "IN",
          email: "amit.patel@example.com",
          phone: "+919898765432",
        },
        shipping: {
          first_name: "Amit",
          last_name: "Patel",
          company: "",
          address_1: "Shop 12, Commercial Complex",
          address_2: "C.G. Road",
          city: "Ahmedabad",
          state: "Gujarat",
          postcode: "380009",
          country: "IN",
          phone: "+919898765432",
        },
        line_items: [
          {
            id: `WC-LI-${Date.now()}`,
            name: "Premium Running Sports Shoes",
            product_id: 201,
            variation_id: 0,
            quantity: 1,
            sku: "SHOE-SPRT-02",
            price: 3099,
            subtotal: "3099.00",
            total: "3099.00",
            total_tax: "342.75",
          },
        ],
      },
    ];
  }
}

module.exports = WooCommerceApiService;
