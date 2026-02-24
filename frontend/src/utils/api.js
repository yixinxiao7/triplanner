import axios from 'axios';

/**
 * Axios instance for all API calls.
 *
 * Base URL: VITE_API_URL env var, defaults to /api/v1 (Vite proxy handles dev routing).
 * Auth: Bearer token injected by request interceptor via the auth context getter.
 * Refresh: Response interceptor catches 401s, calls /auth/refresh, retries original request.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for httpOnly refresh token cookie
});

/**
 * Token getter — will be injected by AuthProvider so the interceptor
 * can access the latest in-memory access token without circular dependency.
 */
let getTokenFn = null;
let setTokenFn = null;
let onUnauthorizedFn = null;

export function configureApiAuth({ getToken, setToken, onUnauthorized }) {
  getTokenFn = getToken;
  setTokenFn = setToken;
  onUnauthorizedFn = onUnauthorized;
}

// ── Request Interceptor ──────────────────────────────────────
// Adds Authorization: Bearer <token> to every request if a token exists.
apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenFn ? getTokenFn() : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────
// On 401: attempt to refresh the access token, then retry the original request.
// If refresh also fails: call onUnauthorized (redirect to /login).
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/login'
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await apiClient.post('/auth/refresh');
      const { access_token } = response.data.data;

      if (setTokenFn) {
        setTokenFn(access_token);
      }

      onRefreshed(access_token);
      isRefreshing = false;

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      if (onUnauthorizedFn) {
        onUnauthorizedFn();
      }
      return Promise.reject(refreshError);
    }
  }
);

export const api = {
  auth: {
    register: (body) => apiClient.post('/auth/register', body),
    login: (body) => apiClient.post('/auth/login', body),
    refresh: () => apiClient.post('/auth/refresh'),
    logout: () => apiClient.post('/auth/logout'),
  },
  trips: {
    list: (params = {}) => apiClient.get('/trips', { params }),
    create: (body) => apiClient.post('/trips', body),
    get: (id) => apiClient.get(`/trips/${id}`),
    update: (id, body) => apiClient.patch(`/trips/${id}`, body),
    delete: (id) => apiClient.delete(`/trips/${id}`),
  },
  flights: {
    list: (tripId) => apiClient.get(`/trips/${tripId}/flights`),
    create: (tripId, body) => apiClient.post(`/trips/${tripId}/flights`, body),
    get: (tripId, id) => apiClient.get(`/trips/${tripId}/flights/${id}`),
    update: (tripId, id, body) => apiClient.patch(`/trips/${tripId}/flights/${id}`, body),
    delete: (tripId, id) => apiClient.delete(`/trips/${tripId}/flights/${id}`),
  },
  stays: {
    list: (tripId) => apiClient.get(`/trips/${tripId}/stays`),
    create: (tripId, body) => apiClient.post(`/trips/${tripId}/stays`, body),
    get: (tripId, id) => apiClient.get(`/trips/${tripId}/stays/${id}`),
    update: (tripId, id, body) => apiClient.patch(`/trips/${tripId}/stays/${id}`, body),
    delete: (tripId, id) => apiClient.delete(`/trips/${tripId}/stays/${id}`),
  },
  activities: {
    list: (tripId) => apiClient.get(`/trips/${tripId}/activities`),
    create: (tripId, body) => apiClient.post(`/trips/${tripId}/activities`, body),
    get: (tripId, id) => apiClient.get(`/trips/${tripId}/activities/${id}`),
    update: (tripId, id, body) => apiClient.patch(`/trips/${tripId}/activities/${id}`, body),
    delete: (tripId, id) => apiClient.delete(`/trips/${tripId}/activities/${id}`),
  },
};

export default api;
