const axios = require("axios");
const AmazonSetting = require("../../models/AmazonSetting.model");

/**
 * Amazon LWA (Login with Amazon) Authentication Service
 * Manages OAuth2 token lifecycle for Amazon Selling Partner API
 */
class AmazonAuthService {
  /**
   * Get a valid LWA access token for Amazon SP-API
   * Uses refresh_token grant to exchange for access_token
   */
  static async getAccessToken() {
    const settings = await AmazonSetting.findOne();
    if (!settings || !settings.isEnabled) {
      throw new Error("Amazon integration is currently disabled in settings");
    }

    if (settings.mode === "simulation") {
      return "SIMULATED_AMAZON_LWA_ACCESS_TOKEN";
    }

    if (!settings.lwaClientId || !settings.lwaClientSecret || !settings.refreshToken) {
      throw new Error("LWA Client ID, Client Secret, and Refresh Token are required for Amazon SP-API authentication");
    }

    // Check if current token is valid (with 5-minute buffer)
    const now = new Date();
    if (
      settings.accessToken &&
      settings.tokenExpiry &&
      new Date(settings.tokenExpiry) > new Date(now.getTime() + 5 * 60 * 1000)
    ) {
      return settings.accessToken;
    }

    // Request new token via LWA OAuth2 refresh_token grant
    try {
      const tokenUrl = "https://api.amazon.com/auth/o2/token";

      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", settings.refreshToken);
      params.append("client_id", settings.lwaClientId);
      params.append("client_secret", settings.lwaClientSecret);

      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      });

      if (response.data && response.data.access_token) {
        const expiresInSeconds = response.data.expires_in || 3600;
        const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);

        settings.accessToken = response.data.access_token;
        settings.tokenExpiry = expiryDate;

        // If Amazon returns a new refresh_token, update it
        if (response.data.refresh_token) {
          settings.refreshToken = response.data.refresh_token;
        }

        await settings.save();

        return response.data.access_token;
      } else {
        throw new Error("Invalid response received from Amazon LWA OAuth service");
      }
    } catch (error) {
      const errDetail =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message;
      throw new Error(`Amazon LWA Authentication Failed: ${errDetail}`);
    }
  }
}

module.exports = AmazonAuthService;
