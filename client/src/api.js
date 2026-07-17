const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOKEN_KEY = 'crosia_token';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.message ||
      data.errors?.[0]?.msg ||
      'Something went wrong';
    throw new Error(message);
  }
  return data;
}

export const api = {
  // auth
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) =>
    request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  forgotPassword: (email) =>
    request('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) =>
    request('/api/auth/reset', { method: 'POST', body: JSON.stringify(body) }),
  health: () => request('/api/health'),

  // products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    const query = qs.toString();
    return request(`/api/products${query ? `?${query}` : ''}`);
  },
  getProduct: (slug) => request(`/api/products/${slug}`),

  // cart
  getCart: () => request('/api/cart'),
  addToCart: (productId, qty = 1) =>
    request('/api/cart', { method: 'POST', body: JSON.stringify({ productId, qty }) }),
  updateCartItem: (productId, qty) =>
    request(`/api/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ qty }) }),
  removeCartItem: (productId) =>
    request(`/api/cart/${productId}`, { method: 'DELETE' }),

  // orders + payment
  getPaymentConfig: () => request('/api/orders/config'),
  createOrder: (shipping) =>
    request('/api/orders/create', { method: 'POST', body: JSON.stringify({ shipping }) }),
  verifyPayment: (body) =>
    request('/api/orders/verify', { method: 'POST', body: JSON.stringify(body) }),
  getOrders: () => request('/api/orders'),
  getOrder: (id) => request(`/api/orders/${id}`),

  // admin
  createProduct: (body) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) =>
    request(`/api/products/${id}`, { method: 'DELETE' }),
  getAllOrders: () => request('/api/orders/admin/all'),
  updateOrderStatus: (id, status) =>
    request(`/api/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },
};
