export enum Role {
  Admin = 'admin',
  Student = 'student',
}

/** Roles lưu trên user trong DB (không gồm admin). */
export type UserRole = Role.Student;

export const USER_ROLES: UserRole[] = [Role.Student];

export const DEFAULT_USER_ROLE: UserRole = Role.Student;

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: 'Quản trị viên',
  [Role.Student]: 'Học viên',
};
