import axios from "axios";
import { setupMockInterceptors } from "./mock-api";

export const API_BASE = import.meta.env.VITE_API_URL || "https://ecom-api-erg7.onrender.com";

export const api = axios.create({ baseURL: API_BASE });

// Global Error Logger - Sanitized for production privacy
function logError(error: any) {
  const meta = {
    url: error.config?.url?.split("?")[0], // Remove query params to avoid leaking data
    method: error.config?.method?.toUpperCase(),
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    timestamp: new Date().toISOString(),
  };
  // Never log error.config itself as it contains the Authorization header
  console.error("[API_ERROR]", meta);
  return meta.message;
}

// DEV MOCK: Enable mock data only if VITE_DEV_MOCK is set to "true" in .env
if (import.meta.env.VITE_DEV_MOCK === "true") {
  setupMockInterceptors(api);
}

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
  | "management"
  | "media_buyer"
  | "customer_service_manager"
  | "logistics_manager"
  | "marketing_manager"
  | "dev"
  | "manager";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  customer_service: "Customer Service (CS)",
  logistics: "Logistics Manager/Agent",
  accountant: "Accountant",
  sales_agent: "Media Buyer (Legacy)",
  delivery_agent: "Delivery Agent",
  management: "Management",
  media_buyer: "Media Buyer",
  customer_service_manager: "CS Manager",
  logistics_manager: "Logistics Manager",
  marketing_manager: "Marketing Manager",
  dev: "Developer",
  manager: "General Manager",
};

export const apiActions = {
  auth: {
    login: (d: any) => api.post("/auth/login", d),
    signup: (d: any) => api.post("/auth/signup", d),
    verifyOtp: (email: string, otp: string) => api.post("/auth/verify-otp", { email, otp }),
    resendOtp: (email: string) => api.post("/auth/resend-otp", { email }),
    forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
    resetPassword: (d: any) => api.post("/auth/reset-password", d),
    logout: () => api.post("/auth/logout"),
  },
  users: {
    list: () => api.get("/users"),
    create: (d: any) => api.post("/users", d),
    update: (id: string, d: any) => api.patch(`/users/${id}`, d),
    updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
    delete: (id: string) => api.delete(`/users/${id}`),
    toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`, {}),
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
    assign: (id: string, assignedTo: string) => api.patch(`/leads/${id}/assign`, { assignedTo }),
    updateStatus: (id: string, status: string) => api.patch(`/leads/${id}/status`, { status }),
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
    getIframeCode: (id: string) => api.get(`/lead-forms/${id}/iframe-code`),
  },
  orders: {
    list: (params?: any) => api.get("/orders", { params }),
    get: (id: string) => api.get(`/orders/${id}`),
    create: (d: any) => api.post("/orders", d),
    updateDelivery: (id: string, d: any) => api.patch(`/orders/${id}/delivery-status`, d),
    updatePayment: (id: string, d: any) => api.patch(`/orders/${id}/payment-status`, d),
    cancel: (id: string) => api.patch(`/orders/${id}/cancel`, {}),
    followUp: (id: string, d: any) => api.patch(`/orders/${id}/follow-up`, d),
  },
  inventory: {
    products: () => api.get("/inventory/products"),
    createProduct: (d: any) => api.post("/inventory/products", d),
    stockIn: (d: any) => api.post("/inventory/in", d),
    transfer: (d: any) => api.post("/inventory/transfer", d),
  },
  products: {
    list: () => api.get("/products"),
    create: (d: any) => api.post("/products", d),
  },
  logistics: {
    deliveries: () => api.get("/logistics/deliveries"),
    assign: (d: any) => api.post("/logistics/deliveries/assign", d),
    updateStatus: (id: string, d: any) => api.patch(`/logistics/deliveries/${id}/status`, d),
  },
  analytics: {
    dashboard: () => api.get("/analytics/dashboard"),
    csDashboard: (params?: any) => api.get("/analytics/cs-dashboard", { params }),
    me: () => api.get("/analytics/me"),
    performance: (params?: any) => api.get("/media-buyers/performance", { params }),
  },
  mediaBuyers: {
    logSpend: (d: any) => api.post("/media-buyers/spend-log", d),
    dashboard: () => api.get("/media-buyers/dashboard"),
  },
  commissions: {
    rules: () => api.get("/commission-rules"),
    createRule: (d: any) => api.post("/commission-rules", d),
  },
  finance: {
    getWalletBalance: (userId: string) => api.get(`/finance/wallet/${userId}`),
    getProfit: () => api.get("/finance/profit"),
  },
  auditTrail: {
    list: () => api.get("/audit-trail"),
  },
  devices: {
    list: () => api.get("/devices"),
    get: (id: string) => api.get(`/devices/${id}`),
    assign: (id: string, d: any) => api.post(`/devices/${id}/assign`, d),
    unassign: (id: string) => api.post(`/devices/${id}/unassign`),
    lock: (id: string, d: any) => api.post(`/devices/${id}/lock`, d),
    unlock: (id: string, d: any) => api.post(`/devices/${id}/unlock`, d),
    wipe: (id: string, d: any) => api.post(`/devices/${id}/wipe`, d),
    sync: () => api.post("/devices/sync"),
  }
};

