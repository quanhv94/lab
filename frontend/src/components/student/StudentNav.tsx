"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookIcon,
  ChartIcon,
  ClipboardIcon,
  FlaskIcon,
  HomeIcon,
  SettingsIcon,
} from "./icons";

const NAV = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/experiments", label: "Thí nghiệm", icon: FlaskIcon },
  { href: "/exercises", label: "Bài tập HSG", icon: BookIcon },
  { href: "/practice", label: "Đề luyện", icon: ClipboardIcon },
  { href: "/results", label: "Kết quả", icon: ChartIcon },
] as const;

export function StudentNavFallback({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <SettingsIcon />
          Cài đặt
        </Link>
      </div>
    </nav>
  );
}

export default function StudentNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[#3b82f6] text-white shadow-md shadow-blue-900/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname.startsWith("/settings")
              ? "bg-[#3b82f6] text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <SettingsIcon />
          Cài đặt
        </Link>
      </div>
    </nav>
  );
}
