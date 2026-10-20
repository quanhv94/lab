export enum Role {
  Admin = "admin",
  Student = "student",
}

/** Roles lưu trên user trong DB (không gồm admin). */
export type UserRole = Role.Student;

export const USER_ROLES: UserRole[] = [Role.Student];

export const DEFAULT_USER_ROLE: UserRole = Role.Student;

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: "Quản trị viên",
  [Role.Student]: "Học viên",
};

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName?: string;
}

export interface ListUsersParams {
  q?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ActivityEntry {
  id: string;
  path: string;
  title: string;
  visitedAt: string;
}

export interface UpdateUserPayload {
  password?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}
