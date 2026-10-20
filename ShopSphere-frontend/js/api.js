
export const API_BASE = window.SHOPSPHERE_API_BASE || 'http://localhost:8080/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem('ss_token');
}

async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  let url = `${API_BASE}${path}`;

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      'Could not reach the Elmavia API. Is the backend running at ' + API_BASE + '?',
      0
    );
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = null; }
  }

  if (!res.ok) {
    const message =
      (payload && payload.message) ||
      (payload && payload.validationErrors && Object.values(payload.validationErrors)[0]) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
}

export const api = {
  // ---- Auth ----
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data) => request('/auth/login', { method: 'POST', body: data, auth: false }),

  // ---- Users ----
  getMe: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PUT', body: data }),

  // ---- Categories ----
  getCategories: () => request('/categories', { auth: false }),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // ---- Products ----
  getProducts: (query) => request('/products', { auth: false, query }),
  getProduct: (id) => request(`/products/${id}`, { auth: false }),
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // ---- Cart ----
  getCart: () => request('/cart'),
  addCartItem: (data) => request('/cart/items', { method: 'POST', body: data }),
  updateCartItem: (cartItemId, data) => request(`/cart/items/${cartItemId}`, { method: 'PUT', body: data }),
  removeCartItem: (cartItemId) => request(`/cart/items/${cartItemId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // ---- Addresses ----
  getAddresses: () => request('/addresses'),
  addAddress: (data) => request('/addresses', { method: 'POST', body: data }),
  updateAddress: (id, data) => request(`/addresses/${id}`, { method: 'PUT', body: data }),
  deleteAddress: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),

  // ---- Orders ----
  createOrder: (data) => request('/orders', { method: 'POST', body: data }),
  getMyOrders: (query) => request('/orders', { query }),
  getMyOrder: (id) => request(`/orders/${id}`),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PUT' }),

  // ---- Admin orders ----
  getAllOrders: (query) => request('/admin/orders', { query }),
  updateOrderStatus: (id, data) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: data }),
};

export { ApiError };
