import requests from "./httpService";

const LoyaltyServices = {
  getAllLoyaltyPoints: async (params = {}, maybeLimit = 20) => {
    let page = 1;
    let limit = 20;
    let search = "";
    let groupType = "";
    let hasPoints = "";
    let tierId = "";

    if (typeof params === "object" && params !== null) {
      page = params.page || 1;
      limit = params.limit || 20;
      search = params.search || "";
      groupType = params.groupType || "";
      hasPoints = params.hasPoints || "";
      tierId = params.tierId || "";
    } else {
      page = params || 1;
      limit = maybeLimit || 20;
    }

    const query = new URLSearchParams({ page, limit });
    if (search) query.append("search", search);
    if (groupType && groupType !== "All") query.append("groupType", groupType);
    if (hasPoints && hasPoints !== "all") query.append("hasPoints", hasPoints);
    if (tierId && tierId !== "all") query.append("tierId", tierId);
    return requests.get(`/loyalty/all?${query.toString()}`);
  },
  getCustomerLoyaltyPoints: async (customerId) => {
    return requests.get(`/loyalty/customer/${customerId}`);
  },
  adjustLoyaltyPoints: async (body) => {
    return requests.post(`/loyalty/adjust`, body);
  },
  // Config
  getConfig: async () => {
    return requests.get(`/loyalty-program/config`);
  },
  updateConfig: async (body) => {
    return requests.post(`/loyalty-program/config`, body);
  },
  // Tiers
  getTiers: async () => {
    return requests.get(`/loyalty-program/tiers`);
  },
  createTier: async (body) => {
    return requests.post(`/loyalty-program/tiers`, body);
  },
  deleteTier: async (id) => {
    return requests.delete(`/loyalty-program/tiers/${id}`);
  },
  updateTier: async (id, body) => {
    return requests.put(`/loyalty-program/tiers/${id}`, body);
  },
  assignTier: async (body) => {
    return requests.post(`/loyalty-program/assign-tier`, body);
  },
  // Rules
  getSaleRules: async () => {
    return requests.get(`/loyalty-program/sale-rules`);
  },
  createSaleRule: async (body) => {
    return requests.post(`/loyalty-program/sale-rules`, body);
  },
  getVisitRules: async () => {
    return requests.get(`/loyalty-program/visit-rules`);
  },
  createVisitRule: async (body) => {
    return requests.post(`/loyalty-program/visit-rules`, body);
  },
  deleteVisitRule: async (id) => {
    return requests.delete(`/loyalty-program/visit-rules/${id}`);
  },
  updateVisitRule: async (id, body) => {
    return requests.put(`/loyalty-program/visit-rules/${id}`, body);
  },
  
  deleteSaleRule: async (id) => {
    return requests.delete(`/loyalty-program/sale-rules/${id}`);
  },
  updateSaleRule: async (id, body) => {
    return requests.put(`/loyalty-program/sale-rules/${id}`, body);
  },

  getItemRules: async () => {
    return requests.get(`/loyalty-program/item-rules`);
  },
  createItemRule: async (body) => {
    return requests.post(`/loyalty-program/item-rules`, body);
  },
  deleteItemRule: async (id) => {
    return requests.delete(`/loyalty-program/item-rules/${id}`);
  },
  updateItemRule: async (id, body) => {
    return requests.put(`/loyalty-program/item-rules/${id}`, body);
  },

  getItemGroupRules: async () => {
    return requests.get(`/loyalty-program/item-group-rules`);
  },
  createItemGroupRule: async (body) => {
    return requests.post(`/loyalty-program/item-group-rules`, body);
  },
  deleteItemGroupRule: async (id) => {
    return requests.delete(`/loyalty-program/item-group-rules/${id}`);
  },
  updateItemGroupRule: async (id, body) => {
    return requests.put(`/loyalty-program/item-group-rules/${id}`, body);
  },

  getLumpsumRules: async () => {
    return requests.get(`/loyalty-program/lumpsum-rules`);
  },
  createLumpsumRule: async (body) => {
    return requests.post(`/loyalty-program/lumpsum-rules`, body);
  },
  deleteLumpsumRule: async (id) => {
    return requests.delete(`/loyalty-program/lumpsum-rules/${id}`);
  },
  updateLumpsumRule: async (id, body) => {
    return requests.put(`/loyalty-program/lumpsum-rules/${id}`, body);
  },

  getCoupons: async () => {
    return requests.get(`/loyalty-program/coupons`);
  },
  createCoupon: async (body) => {
    return requests.post(`/loyalty-program/coupons`, body);
  },
  deleteCoupon: async (id) => {
    return requests.delete(`/loyalty-program/coupons/${id}`);
  },
  updateCoupon: async (id, body) => {
    return requests.put(`/loyalty-program/coupons/${id}`, body);
  },
  getAllIssuedCoupons: async () => {
    return requests.get(`/loyalty-program/all-issued-coupons`);
  },
  getPointsBalance: async (customerId) => {
    return requests.get(`/loyalty-program/points-balance/${customerId}`);
  },
  getCustomerCoupons: async (customerId) => {
    return requests.get(`/loyalty-program/customer-coupons/${customerId}`);
  },
  validateCoupon: async (body) => {
    return requests.post(`/loyalty-program/validate-coupon`, body);
  },
  calculatePoints: async (body) => {
    return requests.post(`/loyalty-program/calculate-points`, body);
  },
};

export default LoyaltyServices;
