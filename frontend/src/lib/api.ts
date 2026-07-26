import axios from 'axios';

// SSR-compatible API URL
const isServer = typeof window === 'undefined';
const getApiUrl = () => {
  if (isServer) {
    return process.env.INTERNAL_API_URL || 'http://api-gateway:4000/api';
  }
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isPublicRoute = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/products') || path.startsWith('/auth/callback') || path.startsWith('/forgot-password');
        const msg = error.response?.data?.message;
        
        // Only redirect to login on protected routes when token is explicitly invalid or user not found
        if (!isPublicRoute && (msg === 'User not found' || msg === 'Invalid token' || msg === 'jwt expired' || msg === 'No token provided' || msg === 'Unauthorized')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: any) => {
    if (data instanceof FormData) {
      return api.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/auth/register', data);
  },
  login: (data: any) => api.post('/auth/login', data),
  uploadProfileImage: (data: FormData) => api.post('/users/profile/image', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadCnicImage: (data: FormData) => api.post('/users/profile/cnic', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  resubmitSeller: () => api.put('/users/profile/resubmit-seller'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/password', data),
  deleteAccount: () => api.delete('/users/profile'),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  setRole: (role: string) => api.post('/auth/role', { role }),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, data: any) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/products/${id}`),
  bulkCreate: (products: any[]) => api.post('/products/bulk', products),
  uploadBulkImages: (data: FormData) => api.post('/products/bulk/images', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStock: (id: string, quantity: number, isSet: boolean = true) => api.put(`/products/${id}/stock`, { quantity, isSet }),
  getSellerProducts: () => api.get('/products/seller'),
};

// Reviews API
export const reviewsAPI = {
  create: (data: FormData) => api.post('/reviews', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createGuest: (data: FormData) => api.post('/reviews/guest', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  getAllAdmin: () => api.get('/reviews/admin/all'),
  getSeller: () => api.get('/reviews/seller'),
  updateStatus: (id: string, status: 'approved' | 'rejected' | 'deactivated' | 'pending') => api.put(`/reviews/${id}/status`, { status }),
  update: (id: string, data: { comment: string, rating: number }) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  getTotal: () => api.get('/cart/total'),
  add: (data: { productId: string; quantity: number; sellerId?: string }) => api.post('/cart/add', data),
  update: (data: { productId: string; quantity: number }) => api.put('/cart/update', data),
  remove: (productId: string) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
};

// Orders API
export const ordersAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders/admin/all'),
  getById: (id: string) => api.get(`/orders/${id}`),
  getSellerOrders: () => api.get('/orders/seller'),
  getSellerBuyers: () => api.get('/orders/seller/buyers'),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  cancelPayment: (id: string) => api.put(`/orders/${id}/cancel-payment`),
  confirmPayment: (id: string, transactionReference: string) => api.post(`/orders/${id}/confirm-payment`, { transactionReference }),
};

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist/add', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/remove/${productId}`),
};

// Admin API
export const adminAPI = {
  // User Management
  getAllUsers: () => api.get('/admin/users'),
  updateUserStatus: (id: string, isActive: boolean) => api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id: string, password?: string) => api.post(`/admin/users/${id}/reset-password`, { password }),
  createSubAdmin: (data: any) => api.post('/admin/sub-admins', data),
  updateSubAdmin: (id: string, data: any) => api.put(`/admin/sub-admins/${id}`, data),
  deleteSubAdmin: (id: string) => api.delete(`/admin/sub-admins/${id}`),
  
  // Seller Approvals
  getPendingSellers: () => api.get('/admin/sellers/pending'),
  approveSeller: (id: string) => api.put(`/admin/sellers/${id}/approve`),
  rejectSeller: (id: string, reason: string) => api.put(`/admin/sellers/${id}/reject`, { reason }),

  // Stats & Logs
  getSalesStats: (period?: string) => api.get('/orders/admin/stats', { params: { period } }),
  getInventory: () => api.get('/products/admin/inventory'),
  getActivityLogs: () => api.get('/admin/logs/activity'),
  getTechnicalLogs: () => api.get('/admin/logs/technical'),
  sendCommunications: (data: { target: string, subject: string, message: string }) => api.post('/admin/communications/send', data),
  getTransactions: () => api.get('/orders/admin/transactions'),
};

// Seller API
export const sellerAPI = {
  sendPromotion: (data: { subject: string, message: string }) => api.post('/admin/seller/communications/send', data),
  getBuyers: () => api.get('/admin/seller/buyers'),
};

// Promotions API
export const promotionsAPI = {
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.put(`/promotions/${id}`, data),
  getAll: () => api.get('/promotions'),
  toggleStatus: (id: string) => api.put(`/promotions/${id}/toggle`),
  validate: (data: { code: string; cartItems: any[] }) => api.post('/promotions/validate', data),
};

// Support API
export const supportAPI = {
  getFAQs: (category?: string) => api.get('/support/faqs', { params: { category } }),
  getAdminFAQs: () => api.get('/support/faqs/admin'),
  createFAQ: (data: any) => api.post('/support/faqs', data),
  updateFAQ: (id: string, data: any) => api.put(`/support/faqs/${id}`, data),
  deleteFAQ: (id: string) => api.delete(`/support/faqs/${id}`),

  createTicket: (data: any) => api.post('/support/tickets', data),
  getTickets: () => api.get('/support/tickets'),
  getTicketById: (id: string) => api.get(`/support/tickets/${id}`),
  updateTicketStatus: (id: string, status: string) => api.put(`/support/tickets/${id}/status`, { status }),
  assignTicket: (id: string, agentId: string) => api.put(`/support/tickets/${id}/assign`, { agentId }),

  sendTicketMessage: (ticketId: string, data: { message: string; attachments?: string[] }) =>
    api.post(`/support/tickets/${ticketId}/messages`, data),
  getTicketMessages: (ticketId: string) => api.get(`/support/tickets/${ticketId}/messages`),
  uploadAttachment: (data: FormData) => api.post('/support/tickets/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUnreadCount: () => api.get('/support/tickets/unread/count'),
};
