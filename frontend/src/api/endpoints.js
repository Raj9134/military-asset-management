import api from "./client.js";

// Every request the application makes goes through one of these modules, so
// endpoint paths are defined in exactly one place. No component calls the
// client directly, and no URL is ever built by string concatenation outside
// this file.

export const authApi = api.auth;

export const basesApi = {
  list: (params) => api.paginated("/bases", { params }),
  listAll: () => api.get("/bases", { params: { limit: 100 } }),
  getById: (id) => api.get(`/bases/${id}`),
  create: (payload) => api.post("/bases", payload),
  update: (id, payload) => api.patch(`/bases/${id}`, payload),
  usage: (id) => api.get(`/bases/${id}/usage`),
};

export const equipmentTypesApi = {
  list: (params) => api.paginated("/equipment-types", { params }),
  listAll: () => api.get("/equipment-types/all"),
  getById: (id) => api.get(`/equipment-types/${id}`),
  create: (payload) => api.post("/equipment-types", payload),
  update: (id, payload) => api.patch(`/equipment-types/${id}`, payload),
  usage: (id) => api.get(`/equipment-types/${id}/usage`),
};

export const usersApi = {
  list: (params) => api.paginated("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post("/users", payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
};

export const purchasesApi = {
  list: (params) => api.paginated("/purchases", { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (payload) => api.post("/purchases", payload),
  reverse: (id, reason) => api.post(`/purchases/${id}/reverse`, { reason }),
};

export const transfersApi = {
  list: (params) => api.paginated("/transfers", { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (payload) => api.post("/transfers", payload),
  approve: (id, reason) => api.post(`/transfers/${id}/approve`, { reason }),
  reject: (id, reason) => api.post(`/transfers/${id}/reject`, { reason }),
  cancel: (id) => api.post(`/transfers/${id}/cancel`),
  complete: (id, notes) => api.post(`/transfers/${id}/complete`, { notes }),
};

export const assignmentsApi = {
  list: (params) => api.paginated("/assignments", { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (payload) => api.post("/assignments", payload),
  returnEquipment: (id, payload) => api.post(`/assignments/${id}/return`, payload),
};

export const expendituresApi = {
  list: (params) => api.paginated("/expenditures", { params }),
  getById: (id) => api.get(`/expenditures/${id}`),
  create: (payload) => api.post("/expenditures", payload),
  reverse: (id, reason) => api.post(`/expenditures/${id}/reverse`, { reason }),
};

export const dashboardApi = {
  summary: (params) => api.get("/dashboard/summary", { params }),
  movements: (params) => api.get("/dashboard/movements", { params }),
  netMovementDetails: (params) => api.get("/dashboard/net-movement-details", { params }),
  filters: () => api.get("/dashboard/filters"),
};

export const auditLogsApi = {
  list: (params) => api.paginated("/audit-logs", { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  filterOptions: () => api.get("/audit-logs/filters"),
};
