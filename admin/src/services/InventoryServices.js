import requests from "./httpService";

const InventoryServices = {
  getAllInventory: async (params = {}) => {
    return requests.get("/inventory", { params });
  },

  getItemInventoryHistory: async (itemId, params = {}) => {
    return requests.get(`/inventory/item/${itemId}`, { params });
  },

  getInventorySources: async () => {
    return requests.get("/inventory/sources");
  },
};

export default InventoryServices;
