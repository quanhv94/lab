import { API_URL, request, tokenStorage } from "./client";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "./types";

export function login(payload: LoginPayload) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return request<AuthUser>("/auth/me");
}

export async function logout() {
  const refreshToken = tokenStorage.getRefresh();
  tokenStorage.clear();
  if (!refreshToken) return;
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore network errors on logout
  }
}

export function persistAuth(res: AuthResponse) {
  tokenStorage.set(res.accessToken, res.refreshToken);
  return res.user;
}
