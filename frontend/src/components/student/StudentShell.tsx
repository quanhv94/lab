"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/api";
import { Loading } from "@/components/ui";
import { useAuth, useRequireAuth } from "@/lib/auth";
import StudentNav, { StudentNavFallback } from "./StudentNav";
import {
  AtomIcon,
  BellIcon,
  CloseIcon,
  MenuIcon,
  SettingsIcon,
} from "./icons";

export default function StudentShell({ children }: { children: ReactNode }) {
  const { allowed, user } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.role === Role.Admin) router.replace("/admin/users");
  }, [user, router]);

  // Auth gate: keep `{children}` in the tree so Cache Components can validate
  // instant navigation for the (student) segment (do not early-return without it).
  const gated = !allowed || !user || user.role === Role.Admin;
  const displayName = user?.fullName || user?.username || "";
  const closeNav = () => setOpen(false);

  return (
    <>
      {gated ? <Loading /> : null}
      <div
        className={`flex min-h-screen bg-[#eef3f9] text-[#0f172a] ${gated ? "hidden" : ""}`}
        aria-hidden={gated || undefined}
      >
        {open && (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0b1f3a] text-white transition-transform lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3b82f6]/20 text-[#60a5fa]">
              <AtomIcon />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">QUANG HỌC ẢO</p>
              <p className="text-[11px] text-slate-400">Học sinh</p>
            </div>
            <button
              className="ml-auto rounded-lg p-1 text-slate-300 lg:hidden"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <Suspense fallback={<StudentNavFallback onNavigate={closeNav} />}>
            <StudentNav onNavigate={closeNav} />
          </Suspense>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b1f3a] px-4 text-white sm:px-6">
            <button
              className="rounded-lg p-1.5 text-slate-200 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <AtomIcon className="text-[#60a5fa]" />
              <span className="text-sm font-semibold tracking-wide">
                QUANG HỌC ẢO - CÔ HẢI YẾN - THCS HƯNG ĐẠO A
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                className="rounded-full p-2 text-slate-200 hover:bg-white/10"
                aria-label="Thông báo"
              >
                <BellIcon />
              </button>

              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6] text-[11px] font-bold">
                  {(displayName.slice(0, 1) || "?").toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate font-medium">
                  {displayName || "…"}
                </span>
              </div>

              <button
                className="rounded-full p-2 text-slate-200 hover:bg-white/10"
                aria-label="Cài đặt"
                onClick={() => router.push("/settings")}
              >
                <SettingsIcon />
              </button>

              <button
                onClick={() => void logout().then(() => router.push("/login"))}
                className="hidden rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10 sm:inline"
              >
                Đăng xuất
              </button>
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5 lg:px-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
