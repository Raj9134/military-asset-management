import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ACCESS_KEY = "mams.accessToken";
const REFRESH_KEY = "mams.refreshToken";

// Session storage rather than local storage: closing the tab ends the session,
// which suits an internal tool on a shared machine.
const session = {
  get access() {
    return sessionStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return sessionStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = session.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A network-level failure surfaces as a TypeError with no HTTP status, because
// the request never reached the server. Without this the user sees a blank
// screen instead of being told the API is unreachable.
const describe = (error) => {
  if (error.response) {
    const body = error.response.data || {};
    return new ApiError(
      error.response.status,
      body.message || "Request failed",
      body.details || null
    );
  }
  if (error.request) {
    return new ApiError(0, "Cannot reach the server. Check that the API is running.");
  }
  return new ApiError(0, error.message);
};

let onSessionExpired = () => {};

export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

// Only one refresh is ever in flight. Without this, a screen that fires several
// requests on mount would send several refreshes and invalidate its own new
// token, logging the user out at random.
let refreshing = null;

async function refreshSession() {
  if (refreshing) return refreshing;

  const refreshToken = session.refresh;
  if (!refreshToken) throw new ApiError(401, "Session expired");

  refreshing = (async () => {
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    session.set(response.data.data);
    return response.data.data.accessToken;
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // A 401 on the refresh call itself is terminal. Retrying it would loop.
    const isRefreshCall = original?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !isRefreshCall && original?._retried !== true) {
      original._retried = true;
      try {
        const accessToken = await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return http(original);
      } catch {
        session.clear();
        onSessionExpired();
        throw describe(error);
      }
    }

    if (error.response?.status === 401 && !session.access) {
      session.clear();
      onSessionExpired();
    }

    throw describe(error);
  }
);

async function unwrap(promise) {
  const response = await promise;
  return response.data.data;
}

export const api = {
  session,

  get: (url, config) => unwrap(http.get(url, config)),
  post: (url, body, config) => unwrap(http.post(url, body, config)),
  patch: (url, body, config) => unwrap(http.patch(url, body, config)),

  // Pagination metadata lives in the envelope, not inside data.data, so it is
  // read from the full response rather than the unwrapped body.
  paginated: async (url, config) => {
    const response = await http.get(url, config);
    return response.data.data;
  },

  auth: {
    login: async (credentials) => {
      const response = await http.post("/auth/login", credentials);
      session.set(response.data.data);
      return response.data.data;
    },
    register: async (payload) => {
      const response = await http.post("/auth/register", payload);
      session.set(response.data.data);
      return response.data.data;
    },
    logout: async () => {
      try {
        await http.post("/auth/logout");
      } finally {
        session.clear();
      }
    },
    me: () => unwrap(http.get("/auth/me")),
    changePassword: (payload) => unwrap(http.post("/auth/change-password", payload)),
  },
};

export default api;
