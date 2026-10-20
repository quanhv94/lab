"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { recordActivity, Role } from "@/api";
import { useAuth } from "@/lib/auth";
import { screenTitle } from "@/lib/screen-title";

const SKIP = [/^\/$/, /^\/login$/, /^\/register$/, /^\/admin(\/|$)/];

export default function ActivityTracker() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const lastKey = useRef("");

  useEffect(() => {
    if (!ready || !user || user.role !== Role.Student) return;
    if (!pathname || SKIP.some((pattern) => pattern.test(pathname))) return;
    const key = `${user.id}:${pathname}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    void recordActivity(pathname, screenTitle(pathname)).catch(() => undefined);
  }, [pathname, ready, user]);

  return null;
}
