const axios = require("axios");
const FlipkartAuthService = require("./flipkartAuth.service");
const FlipkartSetting = require("../../models/FlipkartSetting.model");

/**
 * Flipkart Seller API Client
 * Wraps Flipkart Seller Orders and Listings API (v3)
 */
class FlipkartApiService {
  /**
   * Get base API URL based on mode
   */
  static getBaseUrl(mode) {
    return mode === "sandbox"
      ? "https://sandbox-api.flipkart.net/sellers/v3"
      : "https://api.flipkart.net/sellers/v3";
  }

  /**
   * Test connection with Flipkart API credentials
   */
  static async testConnection() {
    const settings = await FlipkartSetting.findOne();
    if (!settings) {
      throw new Error("Flipkart settings not found");
    }

    if (settings.mode === "simulation") {
      return {
        success: true,
        mode: "simulation",
        message: "Simulation mode active. Flipkart sync service is fully functional and ready to ingest test orders.",
      };
    }

    if (!settings.appId || !settings.appSecret) {
      throw new Error("App ID and App Secret must be configured to test connection");
    }

    // Try acquiring access token
    const token = await FlipkartAuthService.getAccessToken();
    return {
      success: true,
      mode: settings.mode,
      message: "Successfully connected and authenticated with Flipkart Seller API!",
      tokenPreview: `${token.substring(0, 8)}...`,
    };
  }

  /**
   * Fetch recent orders from Flipkart
   * @param {Object} options - Filter options (fromDate, toDate, status)
   */
  static async fetchOrders(options = {}) {
    const settings = await FlipkartSetting.findOne();
    if (!settings || !settings.isEnabled) {
      throw new Error("Flipkart integration is disabled");
    }

    if (settings.mode === "simulation") {
      // In simulation mode, return simulated recent orders if any or empty array
      return [];
    }

    const token = await FlipkartAuthService.getAccessToken();
    const baseUrl = this.getBaseUrl(settings.mode);

    const fromDate = options.fromDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toDate = options.toDate || new Date().toISOString();

    const payload = {
      filter: {
        orderDate: {
          from: fromDate,
          to: toDate,
        },
        ...(options.status && { states: [options.status] }),
      },
      pagination: {
        pageSize: options.limit || 50,
      },
    };

    try {
      const response = await axios.post(`${baseUrl}/orders/search`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      });

      return response.data?.orderItems || response.data?.orders || [];
    } catch (error) {
      const detail = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message;
      throw new Error(`Failed to fetch orders from Flipkart: ${detail}`);
    }
  }

  /**
   * Update stock / inventory levels on Flipkart
   * @param {Array} inventoryUpdates - Array of { sku, quantity, price }
   */
  static async updateInventory(inventoryUpdates = []) {
    const settings = await FlipkartSetting.findOne();
    if (!settings || !settings.isEnabled) {
      return { success: false, message: "Flipkart integration disabled" };
    }

    if (settings.mode === "simulation") {
      return {
        success: true,
        mode: "simulation",
        updatedCount: inventoryUpdates.length,
        message: `[Simulation] Successfully simulated stock update for ${inventoryUpdates.length} items on Flipkart.`,
      };
    }

    const token = await FlipkartAuthService.getAccessToken();
    const baseUrl = this.getBaseUrl(settings.mode);
    const locationId = settings.locationId || settings.sellerId;

    const listingsPayload = {
      listings: inventoryUpdates.map((item) => ({
        skuId: item.sku,
        ...(locationId && { locationId }),
        inventory: {
          quantity: item.quantity,
        },
        ...(item.price && {
          pricing: {
            mrp: item.price,
            sellingPrice: item.price,
          },
        }),
      })),
    };

    try {
      const response = await axios.post(`${baseUrl}/listings/update`, listingsPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      });

      return {
        success: true,
        data: response.data,
        updatedCount: inventoryUpdates.length,
      };
    } catch (error) {
      const detail = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message;
      throw new Error(`Failed to update Flipkart inventory: ${detail}`);
    }
  }
}

module.exports = FlipkartApiService;
