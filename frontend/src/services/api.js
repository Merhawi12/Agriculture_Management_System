import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: BASE, timeout: 10000 });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('agri_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data?.error || err.message || 'Request failed')
);

export const dashboardApi = { getStats: () => api.get('/dashboard/stats') };

export const cropsApi = {
  getAll: () => api.get('/crops'),
  create: d => api.post('/crops', d),
  update: (id, d) => api.put(`/crops/${id}`, d),
  delete: id => api.delete(`/crops/${id}`),
};

export const livestockApi = {
  getAll: () => api.get('/livestock'),
  create: d => api.post('/livestock', d),
  update: (id, d) => api.put(`/livestock/${id}`, d),
  delete: id => api.delete(`/livestock/${id}`),
};

export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  create: d => api.post('/inventory', d),
  update: (id, d) => api.put(`/inventory/${id}`, d),
  delete: id => api.delete(`/inventory/${id}`),
};

export const financeApi = {
  getAll: () => api.get('/finance'),
  getSummary: () => api.get('/finance/summary'),
  create: d => api.post('/finance', d),
  update: (id, d) => api.put(`/finance/${id}`, d),
  delete: id => api.delete(`/finance/${id}`),
};

export const workersApi = {
  getAll: () => api.get('/workers'),
  create: d => api.post('/workers', d),
  update: (id, d) => api.put(`/workers/${id}`, d),
  delete: id => api.delete(`/workers/${id}`),
};

export const equipmentApi = {
  getAll: () => api.get('/equipment'),
  create: d => api.post('/equipment', d),
  update: (id, d) => api.put(`/equipment/${id}`, d),
  delete: id => api.delete(`/equipment/${id}`),
};

export const salesApi = {
  getAll: () => api.get('/sales'),
  getSummary: () => api.get('/sales/summary'),
  create: d => api.post('/sales', d),
  update: (id, d) => api.put(`/sales/${id}`, d),
  delete: id => api.delete(`/sales/${id}`),
};

export const attendanceApi = {
  getAll:   (p = {}) => api.get('/attendance'  + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getToday: ()       => api.get('/attendance/today'),
  getSummary:(p={})  => api.get('/attendance/summary' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  clockIn:  d        => api.post('/attendance/clock-in', d),
  clockOut: d        => api.post('/attendance/clock-out', d),
  mark:     d        => api.post('/attendance/mark', d),
  update:   (id, d)  => api.put(`/attendance/${id}`, d),
  delete:   id       => api.delete(`/attendance/${id}`),
};

export const tasksApi = {
  getAll:   (p = {}) => api.get('/tasks' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getToday: ()       => api.get('/tasks/today'),
  create:   d        => api.post('/tasks', d),
  update:   (id, d)  => api.put(`/tasks/${id}`, d),
  delete:   id       => api.delete(`/tasks/${id}`),
};

export const payrollApi = {
  getAll:     (p = {}) => api.get('/payroll' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  generate:   month    => api.post(`/payroll/generate/${month}`),
  update:     (id, d)  => api.put(`/payroll/${id}`, d),
  delete:     id       => api.delete(`/payroll/${id}`),
};

export const weatherApi = { get: () => api.get('/weather') };
export const predictionsApi = { get: () => api.get('/predictions') };

export const usersApi = {
  getAll:   (p = {}) => api.get('/users' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getStats: ()       => api.get('/users/stats'),
  getRoles: ()       => api.get('/users/roles'),
  get:      id       => api.get(`/users/${id}`),
  create:   d        => api.post('/users', d),
  update:   (id, d)  => api.put(`/users/${id}`, d),
  delete:   id       => api.delete(`/users/${id}`),
};

export const farmsApi = {
  getAll:   ()       => api.get('/farms'),
  getStats: ()       => api.get('/farms/stats'),
  get:      id       => api.get(`/farms/${id}`),
  create:   d        => api.post('/farms', d),
  update:   (id, d)  => api.put(`/farms/${id}`, d),
  delete:   id       => api.delete(`/farms/${id}`),
};

export const marketplaceApi = {
  getProducts:    (p = {}) => api.get('/marketplace/products' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getProduct:     id       => api.get(`/marketplace/products/${id}`),
  createProduct:  d        => api.post('/marketplace/products', d),
  updateProduct:  (id, d)  => api.put(`/marketplace/products/${id}`, d),
  deleteProduct:  id       => api.delete(`/marketplace/products/${id}`),
  getBuyers:      ()       => api.get('/marketplace/buyers'),
  createBuyer:    d        => api.post('/marketplace/buyers', d),
  updateBuyer:    (id, d)  => api.put(`/marketplace/buyers/${id}`, d),
  deleteBuyer:    id       => api.delete(`/marketplace/buyers/${id}`),
  getOrders:      (p = {}) => api.get('/marketplace/orders' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  createOrder:    d        => api.post('/marketplace/orders', d),
  updateOrder:    (id, d)  => api.put(`/marketplace/orders/${id}`, d),
  deleteOrder:    id       => api.delete(`/marketplace/orders/${id}`),
  getDeliveries:  (p = {}) => api.get('/marketplace/deliveries' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  updateDelivery: (id, d)  => api.put(`/marketplace/deliveries/${id}`, d),
  getSummary:     ()       => api.get('/marketplace/summary'),
};

export const notificationsApi = {
  getAll:        (p = {}) => api.get('/notifications' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getUnreadCount: ()      => api.get('/notifications/unread-count'),
  create:        d        => api.post('/notifications', d),
  markRead:      id       => api.put(`/notifications/${id}/read`, {}),
  markAllRead:   ()       => api.post('/notifications/mark-all-read', {}),
  delete:        id       => api.delete(`/notifications/${id}`),
  weatherAlert:  d        => api.post('/notifications/weather-alert', d),
  irrigationAlert: d      => api.post('/notifications/irrigation-alert', d),
  diseaseAlert:  d        => api.post('/notifications/disease-alert', d),
};

export const publicApi = {
  getStats: () => api.get('/public/stats'),
};
