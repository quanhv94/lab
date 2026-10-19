"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { homePathFor, useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { user, ready, register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(homePathFor(user));
  }, [ready, user, router]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        fullName: form.fullName || undefined,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Đăng ký tài khoản">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Username"
          value={form.username}
          onChange={set("username")}
          autoComplete="username"
          pattern="[a-zA-Z0-9_.]{3,30}"
          title="3-30 ký tự: chữ, số, dấu chấm hoặc gạch dưới"
          required
        />
        <Field label="Họ tên" value={form.fullName} onChange={set("fullName")} />
        <Field
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={set("password")}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Field
          label="Xác nhận mật khẩu"
          type="password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          autoComplete="new-password"
          required
        />
        <Alert>{error}</Alert>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Đang đăng ký..." : "Đăng ký"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-qh-blue underline">
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}
