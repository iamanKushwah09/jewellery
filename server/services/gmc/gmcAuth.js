/**
 * Google Merchant Center Authentication Manager
 * Handles Service Account authentication and token caching
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

let cachedToken = null;
let tokenExpiry = null;

/**
 * Get valid OAuth2 access token for Google Merchant API
 * @returns {Promise<string|null>} OAuth2 Access Token
 */
async function getAccessToken() {
  try {
    // Return cached token if valid (with 5-minute buffer)
    const now = Date.now();
    if (cachedToken && tokenExpiry && now < tokenExpiry - 5 * 60 * 1000) {
      return cachedToken;
    }

    const keyPath = process.env.GMC_SERVICE_ACCOUNT_KEY_PATH;
    const clientEmail = process.env.GMC_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GMC_PRIVATE_KEY 
      ? process.env.GMC_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : null;

    let authClient = null;

    // Option 1: File-based Service Account JSON
    if (keyPath) {
      const resolvedPath = path.resolve(process.cwd(), keyPath);
      if (!fs.existsSync(resolvedPath)) {
        console.warn(`⚠️ GMC: Service account key file not found at: ${resolvedPath}`);
        return null;
      }

      authClient = new google.auth.GoogleAuth({
        keyFile: resolvedPath,
        scopes: ['https://www.googleapis.com/auth/content'],
      });
    } 
    // Option 2: Inline Environment Variables
    else if (clientEmail && privateKey) {
      authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/content'],
      });
    } else {
      console.warn('⚠️ GMC: Neither GMC_SERVICE_ACCOUNT_KEY_PATH nor GMC_SERVICE_ACCOUNT_EMAIL/GMC_PRIVATE_KEY is configured.');
      return null;
    }

    const client = typeof authClient.getClient === 'function' 
      ? await authClient.getClient() 
      : authClient;

    const tokenResponse = await client.getAccessToken();
    const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!token) {
      throw new Error('Received empty access token from Google Auth');
    }

    cachedToken = token;
    // Set expiry to 1 hour (or from response if provided)
    tokenExpiry = tokenResponse?.res?.data?.expires_in 
      ? now + (tokenResponse.res.data.expires_in * 1000) 
      : now + (3600 * 1000);

    return cachedToken;
  } catch (error) {
    console.error('❌ GMC Auth Error:', error.message);
    cachedToken = null;
    tokenExpiry = null;
    return null;
  }
}

/**
 * Clear cached token (e.g., when receiving 401 Unauthorized)
 */
function clearAuthCache() {
  cachedToken = null;
  tokenExpiry = null;
}

module.exports = {
  getAccessToken,
  clearAuthCache
};
