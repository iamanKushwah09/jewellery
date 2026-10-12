const axios = require("axios");
const ShopifySetting = require("../../models/ShopifySetting.model");

/**
 * Shopify Admin REST API Client
 * Connects to Shopify Admin API using Private App / Custom App Admin API Access Token
 */
class ShopifyApiService {
  /**
   * Normalize shop domain into clean myshopify.com or custom domain
   */
  static normalizeDomain(domain) {
    if (!domain) return "";
    return domain
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "")
      .trim();
  }

  /**
   * Build base URL for Shopify Admin API
   */
  static getBaseUrl(shopDomain, apiVersion = "2024-04") {
    const cleanDomain = ShopifyApiService.normalizeDomain(shopDomain);
    return `https://${cleanDomain}/admin/api/${apiVersion}`;
  }

  /**
   * Test connection with configured Shopify credentials
   */
  static async testConnection() {
    const settings = await ShopifySetting.findOne();
    if (!settings) {
      throw new Error("Shopify settings not found in database");
    }

    if (settings.mode === "simulation") {
      return {
        success: true,
        mode: "simulation",
        message:
          "Simulation mode active. Shopify sync service is fully functional and ready to ingest test orders.",
      };
    }

    if (!settings.shopDomain || !settings.accessToken) {
      throw new Error("Shop Domain and Admin Access Token are required to test connection");
    }

    const baseUrl = ShopifyApiService.getBaseUrl(settings.shopDomain, settings.apiVersion);
    try {
      const response = await axios.get(`${baseUrl}/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": settings.accessToken,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      const shop = response.data?.shop || {};
      return {
        success: true,
        mode: "production",
        shopName: shop.name || settings.shopDomain,
        email: shop.email,
        currency: shop.currency,
        domain: shop.myshopify_domain || settings.shopDomain,
        message: `Successfully connected to Shopify store "${shop.name || settings.shopDomain}"!`,
      };
    } catch (error) {
      const status = error.response?.status;
      const errorMsg =
        error.response?.data?.errors ||
        error.response?.data?.message ||
        error.message;

      throw new Error(
        `Shopify Connection Failed (${status || "Network Error"}): ${
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
        }`
      );
    }
  }

  /**
   * Fetch orders from Shopify
   * @param {Object} options - Filtering options (limit, status, created_at_min)
   */
  static async fetchOrders(options = {}) {
    const settings = await ShopifySetting.findOne();
    if (!settings) {
      throw new Error("Shopify settings not configured");
    }

    // In simulation mode, generate realistic Shopify order payload
    if (settings.mode === "simulation") {
      return ShopifyApiService.generateSimulationOrders();
    }

    if (!settings.shopDomain || !settings.accessToken) {
      throw new Error("Shopify credentials not configured");
    }

    const baseUrl = ShopifyApiService.getBaseUrl(settings.shopDomain, settings.apiVersion);
    const params = {
      status: options.status || "any",
      limit: options.limit || 50,
    };

    if (options.createdAtMin) {
      params.created_at_min = options.createdAtMin;
    } else if (settings.lastOrderSyncAt) {
      // Sync orders updated/created since last sync minus 10-minute overlap buffer
      const bufferTime = new Date(new Date(settings.lastOrderSyncAt).getTime() - 10 * 60 * 1000);
      params.created_at_min = bufferTime.toISOString();
    }

    try {
      const response = await axios.get(`${baseUrl}/orders.json`, {
        headers: {
          "X-Shopify-Access-Token": settings.accessToken,
          "Content-Type": "application/json",
        },
        params,
        timeout: 20000,
      });

      return response.data?.orders || [];
    } catch (error) {
      const errMsg = error.response?.data?.errors || error.message;
      throw new Error(
        `Failed to fetch orders from Shopify: ${
          typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg
        }`
      );
    }
  }

  /**
   * Fetch single order by ID
   */
  static async getOrder(orderId) {
    const settings = await ShopifySetting.findOne();
    if (!settings) throw new Error("Shopify settings not found");

    if (settings.mode === "simulation") {
      const simOrders = ShopifyApiService.generateSimulationOrders();
      return simOrders[0];
    }

    const baseUrl = ShopifyApiService.getBaseUrl(settings.shopDomain, settings.apiVersion);
    const response = await axios.get(`${baseUrl}/orders/${orderId}.json`, {
      headers: {
        "X-Shopify-Access-Token": settings.accessToken,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    return response.data?.order;
  }

  /**
   * Mock data generator for simulation mode
   */
  static generateSimulationOrders() {
    const now = new Date();
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `SIM-SHPFY-${Date.now()}`;

    return [
      {
        id: orderId,
        order_number: orderNum,
        name: `#SHP${orderNum}`,
        created_at: now.toISOString(),
        financial_status: "paid",
        fulfillment_status: null,
        currency: "INR",
        total_price: "2499.00",
        subtotal_price: "2231.25",
        total_tax: "267.75",
        customer: {
          id: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
          first_name: "Rahul",
          last_name: "Sharma",
          email: "rahul.sharma@example.com",
          phone: "+919876543210",
        },
        shipping_address: {
          first_name: "Rahul",
          last_name: "Sharma",
          name: "Rahul Sharma",
          address1: "Flat 402, Sunshine Heights",
          address2: "Outer Ring Road, Marathahalli",
          city: "Bengaluru",
          province: "Karnataka",
          country: "India",
          zip: "560037",
          phone: "+919876543210",
        },
        billing_address: {
          first_name: "Rahul",
          last_name: "Sharma",
          name: "Rahul Sharma",
          address1: "Flat 402, Sunshine Heights",
          city: "Bengaluru",
          province: "Karnataka",
          country: "India",
          zip: "560037",
          phone: "+919876543210",
        },
        line_items: [
          {
            id: `LI-${Date.now()}-1`,
            variant_id: "VAR-101",
            title: "Classic Leather Formal Shoes",
            sku: "SHOE-LTHR-01",
            quantity: 1,
            price: "2499.00",
            total_discount: "0.00",
          },
        ],
      },
    ];
  }
}

module.exports = ShopifyApiService;
