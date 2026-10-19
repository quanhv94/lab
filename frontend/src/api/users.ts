import { request } from "./client";
import type {
  CreateUserPayload,
  ListUsersParams,
  Paginated,
  UpdateUserPayload,
  User,
} from "./types";

export function listUsers(params: ListUsersParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  const qs = search.toString();
  return request<Paginated<User>>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export function getUser(id: string) {
  return request<User>(`/admin/users/${id}`);
}

export function createUser(payload: CreateUserPayload) {
  return request<User>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return request<User>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string) {
  return request<void>(`/admin/users/${id}`, { method: "DELETE" });
}
