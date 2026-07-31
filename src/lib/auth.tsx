import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api, getStoredUser, getToken, setStoredUser, setToken, type Role } from "./api";

export interface AuthUser {
  id?: string;
  _id?: string;
  email: string;
  role: Role;
  [k: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, password: string, fullName?: string) => Promise<any>;
  verifyOtp: (email: string, code: string) => Promise<AuthUser>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (d: any) => Promise<void>;
  logout: () => void;
  setRoleOverride: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUser(token: string, fallback: Partial<AuthUser> = {}): AuthUser {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.sub || decoded.id || decoded._id,
      email: decoded.email || fallback.email || "",
      role: (decoded.role as Role) || (fallback.role as Role) || "sales_agent",
      ...decoded,
    };
  } catch {
    return {
      email: fallback.email || "",
      role: (fallback.role as Role) || "sales_agent",
      ...fallback,
    } as AuthUser;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (t) {
      setTokenState(t);
      setUser(u || decodeUser(t));
    } else if (import.meta.env.VITE_DEV_MOCK === "true") {
      // DEV MOCK: Provide a mock admin user if no token is present and MOCK is enabled
      setUser({
        id: "mock-admin",
        email: "admin@ecom.test",
        role: "admin",
      });
      setTokenState("mock-token");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const t: string =
      data?.access_token || data?.token || data?.accessToken || data?.jwt;
    if (!t) throw new Error("No token returned by server");
    setToken(t);
    const apiUser = data?.user || {};
    const u = decodeUser(t, { email, ...apiUser });
    setStoredUser(u);
    setTokenState(t);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName?: string) => {
    const { data } = await api.post("/auth/signup", { email, password, fullName });
    return data;
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    
    // If the backend returns a token, log them in (legacy/convenience)
    const t: string = data?.access_token || data?.token || data?.accessToken || data?.jwt;
    if (t) {
      setToken(t);
      const u = decodeUser(t, { email, ...(data?.user || {}) });
      setStoredUser(u);
      setTokenState(t);
      setUser(u);
      return u;
    }
    
    // Otherwise, just return the success data so the UI can redirect to /login
    return data;
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await api.post("/auth/resend-otp", { email });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  }, []);

  const resetPassword = useCallback(async (d: any) => {
    await api.post("/auth/reset-password", d);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Backend logout failed, logging out locally:", err);
    } finally {
      setToken(null);
      setStoredUser(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const setRoleOverride = useCallback((role: Role) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, role };
      setStoredUser(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      signup,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
      setRoleOverride,
    }),
    [user, token, login, signup, verifyOtp, resendOtp, forgotPassword, resetPassword, logout, setRoleOverride],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
