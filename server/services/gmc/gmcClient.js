/**
 * Google Merchant API Client
 * Wraps HTTP requests with authentication, timeouts, and structured error categorization
 */

const axios = require('axios');
const { getAccessToken, clearAuthCache } = require('./gmcAuth');

const MERCHANT_ID = process.env.GMC_MERCHANT_ID || '';
const API_TIMEOUT = parseInt(process.env.GMC_API_TIMEOUT || '15000', 10);
const API_BASE = 'https://shoppingcontent.googleapis.com/content/v2.1';

/**
 * Categorize Google API errors into standardized types
 * @param {Error} error 
 * @returns {{ code: string, message: string, status: number|null, isTemporary: boolean }}
 */
function categorizeError(error) {
  if (!error.response) {
    // Network errors, timeouts
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    return {
      code: 'TEMPORARY_ERROR',
      message: isTimeout ? `Request timed out after ${API_TIMEOUT}ms` : (error.message || 'Network connection failed'),
      status: null,
      isTemporary: true
    };
  }

  const status = error.response.status;
  const data = error.response.data;
  const errMsg = data?.error?.message || data?.message || error.message;
  const reasons = (data?.error?.errors || []).map(e => e.reason || e.message).join(', ');
  const detailedMsg = reasons ? `${errMsg} (${reasons})` : errMsg;

  if (status === 401) {
    clearAuthCache();
    return {
      code: 'AUTH_ERROR',
      message: `Authentication failed: ${detailedMsg}`,
      status,
      isTemporary: true
    };
  }

  if (status === 403) {
    return {
      code: 'PERMISSION_ERROR',
      message: `Insufficient permissions: ${detailedMsg}`,
      status,
      isTemporary: false
    };
  }

  if (status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: `Google API rate limit exceeded: ${detailedMsg}`,
      status,
      isTemporary: true
    };
  }

  if (status >= 500) {
    return {
      code: 'TEMPORARY_ERROR',
      message: `Google server error (${status}): ${detailedMsg}`,
      status,
      isTemporary: true
    };
  }

  if (status === 400 || status === 422) {
    if (detailedMsg.toLowerCase().includes('image') || detailedMsg.toLowerCase().includes('media')) {
      return {
        code: 'IMAGE_ERROR',
        message: `Image validation failed: ${detailedMsg}`,
        status,
        isTemporary: false
      };
    }
    return {
      code: 'VALIDATION_ERROR',
      message: `Product validation error: ${detailedMsg}`,
      status,
      isTemporary: false
    };
  }

  if (status === 404) {
    return {
      code: 'PRODUCT_DATA_ERROR',
      message: `Resource not found on GMC: ${detailedMsg}`,
      status,
      isTemporary: false
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: detailedMsg || 'Unknown Google Merchant API error',
    status,
    isTemporary: false
  };
}

/**
 * Execute an authenticated request to Google Merchant API
 * @param {Object} options Axios request config
 * @returns {Promise<any>}
 */
async function request(options) {
  if (!MERCHANT_ID) {
    throw new Error('GMC_MERCHANT_ID is not configured in environment');
  }

  let token = await getAccessToken();
  if (!token) {
    throw new Error('GMC authentication failed: unable to obtain access token');
  }

  const config = {
    ...options,
    baseURL: options.baseURL || API_BASE,
    timeout: options.timeout || API_TIMEOUT,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // If 401, retry once with a fresh token
    if (error.response && error.response.status === 401) {
      clearAuthCache();
      token = await getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        try {
          const retryResponse = await axios(config);
          return retryResponse.data;
        } catch (retryError) {
          throw categorizeError(retryError);
        }
      }
    }
    throw categorizeError(error);
  }
}

module.exports = {
  request,
  categorizeError,
  MERCHANT_ID,
  API_BASE,
};
