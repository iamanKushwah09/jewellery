import requests from "./httpService";

const SaleServices = {
  getAllSale: async () => {
    return requests.get("/sale");
  },
  getSaleById: async (id) => {
    return requests.get(`/sale/${id}`);
  },
  createSale: async (data) => {
    return requests.post("/sale", data);
  },
  updateSale: async (id, data) => {
    return requests.put(`/sale/${id}`, data);
  },
  deleteSale: async (id) => {
    return requests.delete(`/sale/${id}`);
  },
  searchSales: async (searchQuery) => {
    try {
      const response = await requests.get(`/sale/search?q=${encodeURIComponent(searchQuery)}`);
      return response;
    } catch (error) {
      console.error('Error searching sales:', error);
      throw error;
    }
  },
  processSale: async (id) => {
    return requests.post(`/sale/process/${id}`);
  },
  convertSaleOrderToSale: async (saleOrderId, data = {}) => {
    return requests.post(`/sale/convert-order/${saleOrderId}`, data);
  },
  getUnbilledSaleOrders: async () => {
    return requests.get('/sale/unbilled-orders');
  },
  getPendingOrdersByCustomer: async (customerId) => {
    return requests.get(`/sale/pending-orders/${customerId}`);
  },
  getSalesByFilter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    const url = `/sale/filter${queryString ? `?${queryString}` : ''}`;
    try {
      const response = await requests.get(url);
      if (response.success !== undefined) {
        return response;
      } else if (Array.isArray(response)) {
        return {
          success: true,
          data: {
            orders: response,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalCount: response.length,
              limit: filters.limit || 20,
              hasNext: false,
              hasPrev: false
            }
          }
        };
      }
      return response;
    } catch (error) {
      console.error('Error filtering sales:', error);
      throw error;
    }
  }
};

export default SaleServices;
