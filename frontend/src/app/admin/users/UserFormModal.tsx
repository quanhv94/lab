"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  createUser,
  DEFAULT_USER_ROLE,
  ROLE_LABELS,
  updateUser,
  USER_ROLES,
  type User,
  type UserRole,
} from "@/api";
import { Alert, Button, Field } from "@/components/ui";

interface Props {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ user, onClose, onSaved }: Props) {
  const isEdit = !!user;
  const [username, setUsername] = useState(user?.username ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? DEFAULT_USER_ROLE);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return updateUser(user.id, {
          fullName,
          role,
          isActive,
          ...(password ? { password } : {}),
        });
      }
      return createUser({ username, fullName, password, role, isActive });
    },
    onSuccess: onSaved,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold">
          {isEdit ? `Sửa người dùng "${user.username}"` : "Thêm người dùng"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isEdit}
            pattern="[a-zA-Z0-9_.]{3,30}"
            title="3-30 ký tự: chữ, số, dấu chấm hoặc gạch dưới"
            required
          />
          <Field label="Họ tên" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required={!isEdit}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            Đang hoạt động
          </label>
          <Alert>{(saveMutation.error as Error | null)?.message}</Alert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
