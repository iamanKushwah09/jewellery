import requests from "./httpService";

const ShopifyServices = {
  getSettings: async () => {
    return requests.get("/shopify/settings");
  },

  updateSettings: async (body) => {
    return requests.post("/shopify/settings", body);
  },

  testConnection: async () => {
    return requests.post("/shopify/test-connection");
  },

  syncNow: async () => {
    return requests.post("/shopify/sync-now");
  },

  getOrders: async ({ page = 1, limit = 20 } = {}) => {
    return requests.get(`/shopify/orders?page=${page}&limit=${limit}`);
  },
};

export default ShopifyServices;
