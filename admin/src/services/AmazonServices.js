import requests from "./httpService";

const AmazonServices = {
  getSettings: async () => {
    return requests.get("/amazon/settings");
  },

  updateSettings: async (body) => {
    return requests.put("/amazon/settings", body);
  },

  testConnection: async () => {
    return requests.post("/amazon/test-connection");
  },

  syncOrders: async () => {
    return requests.post("/amazon/sync-orders");
  },

  syncInventory: async () => {
    return requests.post("/amazon/sync-inventory");
  },

  simulateOrder: async (body) => {
    return requests.post("/amazon/simulate-order", body);
  },

  getOrders: async ({ page = 1, limit = 20, search = "" }) => {
    return requests.get(`/amazon/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  getLogs: async ({ page = 1, limit = 25, syncType = "" }) => {
    return requests.get(`/amazon/logs?page=${page}&limit=${limit}&syncType=${syncType}`);
  },

  getMappedProducts: async ({ page = 1, limit = 20, search = "", filter = "all" }) => {
    return requests.get(`/amazon/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${filter}`);
  },

  updateProductMapping: async (body) => {
    return requests.put("/amazon/products/map", body);
  },

  uploadProduct: async (productId) => {
    return requests.post("/amazon/products/upload", { productId });
  },

  autoMapAll: async () => {
    return requests.post("/amazon/products/auto-map");
  },
};

export default AmazonServices;
