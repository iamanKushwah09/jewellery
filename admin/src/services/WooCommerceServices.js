import requests from "./httpService";

const WooCommerceServices = {
  getSettings: async () => {
    return requests.get("/woocommerce/settings");
  },

  updateSettings: async (body) => {
    return requests.post("/woocommerce/settings", body);
  },

  testConnection: async () => {
    return requests.post("/woocommerce/test-connection");
  },

  syncNow: async () => {
    return requests.post("/woocommerce/sync-now");
  },

  getOrders: async ({ page = 1, limit = 20 } = {}) => {
    return requests.get(`/woocommerce/orders?page=${page}&limit=${limit}`);
  },
};

export default WooCommerceServices;
