import requests from "./httpService";

const SalesmanVisitServices = {
  // Tracking
  getLiveLocations: async () => {
    return requests.get("/salesman-tracking/live-locations");
  },
  getLocationHistory: async (salesmanId, date = "") => {
    return requests.get(`/salesman-tracking/history/${salesmanId}?date=${date}`);
  },
  getTodaySummary: async () => {
    return requests.get("/salesman-tracking/today-summary");
  },
  updateLocationRest: async (body) => {
    return requests.post("/salesman-tracking/update-location", body);
  },

  // Visits
  getAllVisits: async (params = {}) => {
    const res = await requests.get("/salesman-visit", { params });
    return {
      visits: res?.visits || [],
      totalDoc: res?.totalDoc || 0,
      limits: res?.limit || params?.limit || 20,
      pages: res?.page || params?.page || 1,
    };
  },
  getVisitById: async (id) => {
    return requests.get(`/salesman-visit/${id}`);
  },
  createVisit: async (body) => {
    return requests.post("/salesman-visit", body);
  },
  updateVisit: async (id, body) => {
    return requests.put(`/salesman-visit/${id}`, body);
  },
  checkIn: async (id, body) => {
    return requests.put(`/salesman-visit/${id}/check-in`, body);
  },
  checkOut: async (id, body) => {
    return requests.put(`/salesman-visit/${id}/check-out`, body);
  },
  addPhoto: async (id, body) => {
    return requests.post(`/salesman-visit/${id}/add-photo`, body);
  },
  deleteVisit: async (id) => {
    return requests.delete(`/salesman-visit/${id}`);
  },

  // Routes
  getAllRoutes: async (params = {}) => {
    const res = await requests.get("/salesman-route", { params });
    return {
      routes: res?.routes || [],
      totalDoc: res?.totalDoc || 0,
      limits: res?.limit || params?.limit || 20,
      pages: res?.page || params?.page || 1,
    };
  },
  getRouteById: async (id) => {
    return requests.get(`/salesman-route/${id}`);
  },
  createRoute: async (body) => {
    return requests.post("/salesman-route", body);
  },
  updateRoute: async (id, body) => {
    return requests.put(`/salesman-route/${id}`, body);
  },
  deleteRoute: async (id) => {
    return requests.delete(`/salesman-route/${id}`);
  },

  // Collections
  addCollection: async (body) => {
    return requests.post("/salesman-collection", body);
  },
  getCollectionReport: async (params = {}) => {
    return requests.get("/salesman-collection/report", { params });
  },

  // Geocoding (Google Maps via server — API key stays secure)
  reverseGeocode: async (lat, lng) => {
    return requests.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
  },
  forwardGeocode: async (address) => {
    return requests.get(`/location/forward-geocode?address=${encodeURIComponent(address)}`);
  },
};

export default SalesmanVisitServices;
