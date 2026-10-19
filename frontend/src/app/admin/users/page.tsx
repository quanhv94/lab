"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  deleteUser,
  listUsers,
  Role,
  ROLE_LABELS,
  updateUser,
  USER_ROLES,
  userKeys,
  type User,
  type UserRole,
} from "@/api";
import { Alert, Button, Loading } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import UserFormModal from "./UserFormModal";

const LIMIT = 10;

export default function AdminUsersPage() {
  const { allowed } = useRequireAuth(Role.Admin);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = {
    page,
    limit: LIMIT,
    q: query || undefined,
    role: roleFilter || undefined,
  };

  const usersQuery = useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    enabled: allowed,
  });

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: userKeys.lists() });

  const toggleMutation = useMutation({
    mutationFn: (user: User) => updateUser(user.id, { isActive: !user.isActive }),
    onSuccess: invalidateUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (user: User) => deleteUser(user.id),
    onSuccess: () => {
      if (usersQuery.data && usersQuery.data.items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void invalidateUsers();
      }
    },
  });

  if (!allowed) return <Loading />;

  const data = usersQuery.data;
  const error =
    (usersQuery.error as Error | null)?.message ||
    (toggleMutation.error as Error | null)?.message ||
    (deleteMutation.error as Error | null)?.message ||
    "";
  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo username, họ tên..."
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as UserRole | "");
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">Tất cả role</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <Button onClick={() => setEditing(null)}>+ Thêm người dùng</Button>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.isPending && (
              <tr>
                <td colSpan={6}>
                  <Loading />
                </td>
              </tr>
            )}
            {!usersQuery.isPending && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Không có người dùng nào
                </td>
              </tr>
            )}
            {data?.items.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName || "—"}</td>
                <td className="px-4 py-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {u.isActive ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(u.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" className="px-3 py-1" onClick={() => setEditing(u)}>
                      Sửa
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(u)}
                    >
                      {u.isActive ? "Khóa" : "Mở khóa"}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Xóa người dùng "${u.username}"?`)) {
                          deleteMutation.mutate(u);
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Tổng: {data.total} người dùng</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Trước
            </Button>
            <span>
              Trang {page}/{totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {editing !== undefined && (
        <UserFormModal
          key={editing?.id ?? "new"}
          user={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void invalidateUsers();
          }}
        />
      )}
    </div>
  );
}
