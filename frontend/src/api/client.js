const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'An error occurred while communicating with the server.');
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Categories
  getCategories: () => request('/categories/'),
  createCategory: (payload) => request('/categories/', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions/${query ? `?${query}` : ''}`);
  },
  createTransaction: (payload) => request('/transactions/', { method: 'POST', body: JSON.stringify(payload) }),
  updateTransaction: (id, payload) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  uploadCsv: (formData) => request('/transactions/upload-csv', { method: 'POST', body: formData }),

  // Budgets
  getBudgetProgress: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return request(`/budgets/progress?${params.toString()}`);
  },
  createBudget: (payload) => request('/budgets/', { method: 'POST', body: JSON.stringify(payload) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // AI & Smart Insighter
  autoCategorize: (description) => request('/ai/categorize', { method: 'POST', body: JSON.stringify({ description }) }),
  submitCorrectionFeedback: (payload) => request('/ai/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  getForecast: () => request('/ai/forecast'),
  getAnomalies: () => request('/ai/anomalies'),
  getRecurringSubscriptions: () => request('/ai/recurring-subscriptions'),
  getSpendingPersona: () => request('/ai/spending-persona'),
  getRecommendations: () => request('/ai/recommendations'),

  // Analytics & Dashboard
  getDashboardOverview: () => request('/analytics/dashboard-overview'),

  // Admin Portal
  getAdminOverview: () => request('/admin/system-overview'),
  getAdminUserAnalytics: (userId) => request(`/admin/users/${userId}/analytics`),
  toggleUserStatus: (userId) => request(`/admin/users/${userId}/status`, { method: 'PUT' }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' })
};


