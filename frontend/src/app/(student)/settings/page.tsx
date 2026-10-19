"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/api";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
      <p className="mt-1 text-sm text-qh-muted">Thông tin tài khoản học viên</p>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Username" value={user.username} />
        <Row label="Họ tên" value={user.fullName || "—"} />
        <Row label="Vai trò" value={ROLE_LABELS[user.role]} />
      </dl>

      <Button
        className="mt-8"
        variant="secondary"
        onClick={() => void logout().then(() => router.push("/login"))}
      >
        Đăng xuất
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-qh-muted">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
