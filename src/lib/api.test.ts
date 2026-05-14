import { describe, it, expect, beforeEach, vi } from "vitest";
import { getToken, setToken, getStoredUser, setStoredUser } from "./api";

describe("API Storage Utilities", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    vi.clearAllMocks();
  });

  it("getToken returns null if empty", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken saves to localStorage", () => {
    setToken("test-token");
    expect(window.localStorage.getItem("ecrm_token")).toBe("test-token");
    expect(getToken()).toBe("test-token");
  });

  it("setToken(null) removes from localStorage", () => {
    window.localStorage.setItem("ecrm_token", "old-token");
    setToken(null);
    expect(window.localStorage.getItem("ecrm_token")).toBeNull();
  });

  it("getStoredUser returns parsed user", () => {
    const user = { email: "test@ecom.com", role: "admin" };
    window.localStorage.setItem("ecrm_user", JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);
  });

  it("setStoredUser saves stringified user", () => {
    const user = { email: "new@ecom.com", role: "logistics" };
    setStoredUser(user);
    expect(window.localStorage.getItem("ecrm_user")).toBe(JSON.stringify(user));
  });
});
