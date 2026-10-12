const axios = require("axios");
const FlipkartSetting = require("../../models/FlipkartSetting.model");

/**
 * Flipkart Authentication Service
 * Manages OAuth2 token lifecycle for Flipkart Seller API
 */
class FlipkartAuthService {
  /**
   * Get a valid OAuth2 access token for Flipkart Seller API
   */
  static async getAccessToken() {
    const settings = await FlipkartSetting.findOne();
    if (!settings || !settings.isEnabled) {
      throw new Error("Flipkart integration is currently disabled in settings");
    }

    if (settings.mode === "simulation") {
      return "SIMULATED_FLIPKART_OAUTH_TOKEN";
    }

    if (!settings.appId || !settings.appSecret) {
      throw new Error("Flipkart App ID and App Secret are required for API authentication");
    }

    // Check if current token is valid (with 5-minute buffer)
    const now = new Date();
    if (settings.accessToken && settings.tokenExpiry && new Date(settings.tokenExpiry) > new Date(now.getTime() + 5 * 60 * 1000)) {
      return settings.accessToken;
    }

    // Request new token via OAuth2 client_credentials grant
    try {
      const authUrl = settings.mode === "sandbox"
        ? "https://sandbox-api.flipkart.net/oauth-service/oauth/token"
        : "https://api.flipkart.net/oauth-service/oauth/token";

      const authHeader = Buffer.from(`${settings.appId}:${settings.appSecret}`).toString("base64");

      const response = await axios.get(`${authUrl}?grant_type=client_credentials&scope=Seller_api`, {
        headers: {
          Authorization: `Basic ${authHeader}`,
          Accept: "application/json",
        },
        timeout: 15000,
      });

      if (response.data && response.data.access_token) {
        const expiresInSeconds = response.data.expires_in || 3600;
        const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);

        settings.accessToken = response.data.access_token;
        settings.tokenExpiry = expiryDate;
        await settings.save();

        return response.data.access_token;
      } else {
        throw new Error("Invalid response received from Flipkart OAuth service");
      }
    } catch (error) {
      const errDetail = error.response?.data?.error_description || error.response?.data?.error || error.message;
      throw new Error(`Flipkart OAuth Authentication Failed: ${errDetail}`);
    }
  }
}

module.exports = FlipkartAuthService;
