// API utility for LeaseLand
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('leaseLandToken');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  // Convert body to JSON if it's an object (not FormData)
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  return response.text();
}

// Auth API
export const authApi = {
  signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
  updateState: (data) => request('/auth/state', { method: 'PUT', body: data }),
  getStates: () => request('/auth/states'),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: data }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: data }),
};

// Lease Checker API
export const leaseApi = {
  check: (data) => request('/lease/check', { method: 'POST', body: data }),
  upload: (formData) => request('/lease/upload', { method: 'POST', body: formData }),
  history: () => request('/lease/history'),
};

// Assistant API
export const assistantApi = {
  ask: (data) => request('/assistant/ask', { method: 'POST', body: data }),
  conversations: () => request('/assistant/conversations'),
  getConversation: (id) => request(`/assistant/conversation/${id}`),
};

// Payments API
export const paymentsApi = {
  createCheckout: (data) => request('/payments/create-checkout', { method: 'POST', body: data }),
  history: () => request('/payments/history'),
  status: () => request('/payments/status'),
};

// Referral API
export const referralApi = {
  code: () => request('/referral/code'),
  stats: () => request('/referral/stats'),
};