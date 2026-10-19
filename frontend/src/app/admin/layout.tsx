"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@/api";
import { Loading } from "@/components/ui";
import { useAuth, useRequireAuth } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { allowed, user } = useRequireAuth(Role.Admin);
  const { logout } = useAuth();
  const router = useRouter();

  if (!allowed || !user) return <Loading />;

  return (
    <div className="min-h-screen bg-[#eef3f9]">
      <header className="border-b border-white/10 bg-[#0b1f3a] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/users" className="font-semibold tracking-wide">
              QUANG HỌC ẢO · Admin
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg bg-[#3b82f6] px-3 py-1.5 text-sm font-medium"
            >
              Quản lý người dùng
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">{user.username}</span>
            <button
              onClick={() => void logout().then(() => router.push("/login"))}
              className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
