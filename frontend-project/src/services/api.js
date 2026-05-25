import axios from 'axios';
import { getToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),       // Login user
  register: (data) => api.post('/auth/register', data),  // Register new user
  getMe: () => api.get('/auth/me'),                      // Get logged-in user profile
  logout: () => api.post('/auth/logout'),                // Logout user
};

export const productAPI = {
  getAll: () => api.get('/products'),                            // Fetch all products
  getById: (id) => api.get(`/products/${id}`),                   // Fetch single product by ID
  create: (data) => api.post('/products', data),                 // Create new product
  update: (id, data) => api.put(`/products/${id}`, data),        // Update product by ID
  delete: (id) => api.delete(`/products/${id}`),                 // Delete product by ID
};

export const saleAPI = {
  getAll: () => api.get('/sales'),                          // Fetch all sales
  getById: (id) => api.get(`/sales/${id}`),                 // Fetch single sale by ID
  create: (data) => api.post('/sales', data),               // Record new sale
  update: (id, data) => api.put(`/sales/${id}`, data),      // Update sale by ID
  delete: (id) => api.delete(`/sales/${id}`),               // Delete sale by ID
};

export const stockAPI = {
  getAll: () => api.get('/stock'),                           // Fetch all stock statuses
  getById: (id) => api.get(`/stock/${id}`),                  // Fetch stock status by ID
  create: (data) => api.post('/stock', data),                // Create new stock status
  update: (id, data) => api.put(`/stock/${id}`, data),       // Update stock status by ID
  delete: (id) => api.delete(`/stock/${id}`),                // Delete stock status by ID
};

export const reportAPI = {
  dailySales: (date) => api.get('/reports/daily-sales', { params: { date } }),  // Fetch daily sales report
  stockStatus: () => api.get('/reports/stock-status'),                           // Fetch stock status report
};

export default api;
