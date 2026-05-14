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
  signup: (email: string, password: string) => Promise<any>;
  verifyOtp: (email: string, code: string) => Promise<AuthUser>;
  resendOtp: (email: string) => Promise<void>;
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
    } else {
      // DEV BYPASS: Provide a mock admin user if no token is present
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

  const signup = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/signup", { email, password });
    return data;
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const { data } = await api.post("/auth/verify-otp", { email, code });
    const t: string = data?.access_token || data?.token || data?.accessToken || data?.jwt;
    if (!t) throw new Error("No token returned after verification");
    setToken(t);
    const u = decodeUser(t, { email, ...(data?.user || {}) });
    setStoredUser(u);
    setTokenState(t);
    setUser(u);
    return u;
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await api.post("/auth/resend-otp", { email });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
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
      logout,
      setRoleOverride,
    }),
    [user, token, login, signup, verifyOtp, resendOtp, logout, setRoleOverride],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
