import requests from "./httpService";

const ItemGroupServices = {
  // role
  addItemGroup: async (body) => {
    return requests.post("/item-groups", body);
  },
  getAllItemGroup: async (params = {}) => {
    const res = await requests.get("/item-groups", { params });
    if (Array.isArray(res)) {
      return {
        itemGroups: res,
        totalDoc: res.length,
        limits: params?.limit || 20,
        pages: params?.page || 1
      };
    }
    return {
      itemGroups: res?.itemGroups || [],
      totalDoc: res?.totalDoc || 0,
      limits: res?.limits || params?.limit || 20,
      pages: res?.pages || params?.page || 1
    };
  },
  getActiveItemGroup: async () => {
    return requests.get("/item-groups/active");
  },
  deleteItemGroup: async (id) => {
    console.log({ id });
    return requests.delete(`/item-groups/${id}`);
  },
  deleteManyItemGroup: async (body) => {
    if (body?.ids && Array.isArray(body.ids)) {
      return Promise.all(body.ids.map((id) => requests.delete(`/item-groups/${id}`)))
        .then(() => ({ message: "Selected item groups deleted successfully" }));
    }
    return requests.delete("/item-groups");
  },
  deleteAllItemGroup: async () => {
    return requests.delete("/item-groups");
  },

  getItemGroupById: async (id) => {
    return requests.get(`/item-groups/${id}`);
  },
  updateItemGroup: async (id, data) => {
    return requests.put(`/item-groups/${id}`, data);
  },
  updateStatus: async (id, data) => {
    return requests.put(`/item-groups/${id}`, data);
  },
  syncItemGroup: async () => {
    return requests.get("/item-groups/refresh");
  },
};

export default ItemGroupServices;
