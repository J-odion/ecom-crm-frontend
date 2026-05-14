import axios from "axios";
import { setupMockInterceptors } from "./mock-api";

export const API_BASE = import.meta.env.VITE_API_URL || "https://ecom-api-erg7.onrender.com";

export const api = axios.create({ baseURL: API_BASE });

// Global Error Logger for debugging & monitoring
function logError(error: any) {
  const meta = {
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    timestamp: new Date().toISOString(),
  };
  console.error("[API_ERROR]", meta);
  return meta.message;
}

// DEV MOCK: Enable mock data for testing
setupMockInterceptors(api);

const TOKEN_KEY = "ecrm_token";
const USER_KEY = "ecrm_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
}
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setStoredUser(u: any | null) {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  else window.localStorage.removeItem(USER_KEY);
}

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = logError(err);
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      setToken(null);
      setStoredUser(null);
    }
    // Attach the user-friendly message to the error object for easy access in components
    err.friendlyMessage = message;
    return Promise.reject(err);
  },
);

export type Role =
  | "admin"
  | "customer_service"
  | "logistics"
  | "accountant"
  | "sales_agent"
  | "delivery_agent"
  | "management";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  customer_service: "Customer Service (CS)",
  logistics: "Logistics",
  accountant: "Accountant",
  sales_agent: "Media Buyer",
  delivery_agent: "Delivery Agent",
  management: "Management",
};

export const apiActions = {
  auth: {
    login: (d: any) => api.post("/auth/login", d),
    signup: (d: any) => api.post("/auth/signup", d),
    verifyOtp: (email: string, code: string) => api.post("/auth/verify-otp", { email, code }),
    resendOtp: (email: string) => api.post("/auth/resend-otp", { email }),
    forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
    resetPassword: (d: any) => api.post("/auth/reset-password", d),
  },
  users: {
    list: () => api.get("/users"),
    update: (id: string, d: any) => api.patch(`/users/${id}`, d),
    delete: (id: string) => api.delete(`/users/${id}`),
  },
  locations: {
    list: () => api.get("/locations"),
    create: (d: any) => api.post("/locations", d),
    update: (id: string, d: any) => api.patch(`/locations/${id}`, d),
    delete: (id: string) => api.delete(`/locations/${id}`),
  },
  leads: {
    list: (params?: any) => api.get("/leads", { params }),
    get: (id: string) => api.get(`/leads/${id}`),
    assign: (id: string, agentId: string) => api.patch(`/leads/${id}/assign`, { agentId }),
    create: (d: any) => api.post("/leads", d),
    partial: (d: any) => api.post("/leads/partial", d),
    webhook: (d: any) => api.post("/leads/webhook", d),
  },
  leadForms: {
    list: () => api.get("/lead-forms"),
    get: (id: string) => api.get(`/lead-forms/${id}`),
    create: (d: any) => api.post("/lead-forms", d),
    update: (id: string, d: any) => api.patch(`/lead-forms/${id}`, d),
    delete: (id: string) => api.delete(`/lead-forms/${id}`),
    getIframe: (id: string) => `${API_BASE}/lead-forms/${id}/embed`,
  },
  orders: {
    list: () => api.get("/orders"),
    get: (id: string) => api.get(`/orders/${id}`),
    create: (d: any) => api.post("/orders", d),
    updateDelivery: (id: string, d: any) => api.patch(`/orders/${id}/delivery-status`, d),
    updatePayment: (id: string, d: any) => api.patch(`/orders/${id}/payment-status`, d),
    cancel: (id: string) => api.patch(`/orders/${id}/cancel`, {}),
  },
  inventory: {
    products: () => api.get("/inventory/products"),
    createProduct: (d: any) => api.post("/inventory/products", d),
    stockIn: (d: any) => api.post("/inventory/in", d),
    transfer: (d: any) => api.post("/inventory/transfer", d),
  },
  logistics: {
    deliveries: () => api.get("/logistics/deliveries"),
    assign: (d: any) => api.post("/logistics/deliveries/assign", d),
    updateStatus: (id: string, d: any) => api.patch(`/logistics/deliveries/${id}/status`, d),
  },
  analytics: {
    dashboard: () => api.get("/analytics/dashboard"),
    performance: () => api.get("/media-buyers/performance"),
  },
  commissions: {
    rules: () => api.get("/commission-rules"),
  }
};
