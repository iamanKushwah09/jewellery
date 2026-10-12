import requests from "./httpService";

const FlipkartServices = {
  getSettings: async () => {
    return requests.get("/flipkart/settings");
  },

  updateSettings: async (body) => {
    return requests.put("/flipkart/settings", body);
  },

  testConnection: async () => {
    return requests.post("/flipkart/test-connection");
  },

  syncOrders: async () => {
    return requests.post("/flipkart/sync-orders");
  },

  syncInventory: async () => {
    return requests.post("/flipkart/sync-inventory");
  },

  simulateOrder: async (body) => {
    return requests.post("/flipkart/simulate-order", body);
  },

  getOrders: async ({ page = 1, limit = 20, search = "" }) => {
    return requests.get(`/flipkart/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  getLogs: async ({ page = 1, limit = 25, syncType = "" }) => {
    return requests.get(`/flipkart/logs?page=${page}&limit=${limit}&syncType=${syncType}`);
  },

  getMappedProducts: async ({ page = 1, limit = 20, search = "", filter = "all" }) => {
    return requests.get(`/flipkart/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${filter}`);
  },

  updateProductMapping: async (body) => {
    return requests.put("/flipkart/products/map", body);
  },

  uploadProduct: async (productId) => {
    return requests.post("/flipkart/products/upload", { productId });
  },

  autoMapAll: async () => {
    return requests.post("/flipkart/products/auto-map");
  },
};

export default FlipkartServices;
