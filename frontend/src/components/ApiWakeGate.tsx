"use client";

import { useEffect, useState, type ReactNode } from "react";
import { API_URL } from "@/api";

const ATTEMPT_TIMEOUT_MS = 12_000;
const RETRY_DELAY_MS = 2_000;

async function healthIsReady(signal: AbortSignal) {
  const response = await fetch(`${API_URL}/health`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) return false;
  const data = (await response.json().catch(() => null)) as {
    status?: string;
  } | null;
  return data?.status === "ok";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ApiWakeGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    async function wake() {
      while (!cancelled) {
        if (Date.now() - started > 15_000) setSlow(true);
        const attempt = new AbortController();
        const timer = setTimeout(() => attempt.abort(), ATTEMPT_TIMEOUT_MS);
        try {
          if (await healthIsReady(attempt.signal)) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // Service is still spinning up.
        } finally {
          clearTimeout(timer);
        }
        await wait(RETRY_DELAY_MS);
      }
    }

    void wake();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0b1f3a] via-[#12325a] to-[#1d6feb] px-6 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-white" />
        <p className="mt-6 text-lg font-semibold tracking-wide">QUANG HỌC ẢO</p>
        <p className="mt-2 text-sm text-blue-50/90">
          {slow
            ? "Máy chủ đang khởi động, vui lòng đợi thêm một chút..."
            : "Đang kết nối máy chủ..."}
        </p>
      </div>
    );
  }

  return children;
}
