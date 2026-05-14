import axios from "axios";
import { setupMockInterceptors } from "./mock-api";

export const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "https://ecom-api-erg7.onrender.com";

export const api = axios.create({ baseURL: API_BASE });

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
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      setToken(null);
      setStoredUser(null);
    }
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
