import requests from "./httpService";

const GmcServices = {
  // Trigger full catalog batch sync
  syncAllProducts: async () => {
    return requests.post("/gmc/sync");
  },

  // Get GMC overview status & queue metrics
  getStatus: async () => {
    return requests.get("/gmc/status");
  },

  // Sync single product
  syncProduct: async (id) => {
    return requests.post(`/gmc/product/${id}`);
  },

  // Retry failed product sync
  retryProduct: async (id) => {
    return requests.post(`/gmc/product/${id}/retry`);
  },

  // Delete product from GMC
  deleteProduct: async (id) => {
    return requests.delete(`/gmc/product/${id}`);
  },

  // Get audit logs
  getLogs: async (params = {}) => {
    return requests.get("/gmc/logs", { params });
  }
};

export default GmcServices;
