"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPracticeResult, practiceResultKeys } from "@/api";
import { Loading } from "@/components/ui";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function kindLabel(kind: string) {
  switch (kind) {
    case "mcq":
      return "Trắc nghiệm";
    case "tf":
      return "Đúng/Sai";
    case "short":
      return "Trả lời ngắn";
    case "fill":
      return "Điền khuyết";
    case "essay-radio":
      return "Tự luận (chọn)";
    default:
      return kind;
  }
}

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: practiceResultKeys.detail(id),
    queryFn: () => getPracticeResult(id),
    enabled: !!id,
  });

  if (isLoading) return <Loading />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/results"
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại Kết quả
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(error as Error | undefined)?.message || "Không tìm thấy kết quả"}
        </div>
      </div>
    );
  }

  const pct = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
  const correctCount = data.items.filter((i) => i.correct).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/results"
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại Kết quả
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {data.examTitle}
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Nộp lúc {formatWhen(data.submittedAt)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Điểm
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatScore(data.score)}
            <span className="text-base font-medium text-slate-500">
              /{formatScore(data.maxScore)}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Tỉ lệ
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              pct >= 80
                ? "text-emerald-600"
                : pct >= 50
                  ? "text-amber-600"
                  : "text-red-600"
            }`}
          >
            {pct.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Đúng
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {correctCount}
            <span className="text-base font-medium text-slate-500">
              /{data.items.length}
            </span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Chi tiết từng ý</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {data.items.map((item, idx) => (
            <li
              key={`${item.name}-${idx}`}
              className={`px-4 py-3 ${
                item.correct ? "bg-emerald-50/40" : "bg-red-50/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    {kindLabel(item.kind)} · {item.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    Em chọn:{" "}
                    <span className="font-medium">
                      {item.userAnswer || "(trống)"}
                    </span>
                  </p>
                  {!item.correct && (
                    <p className="mt-0.5 text-sm text-emerald-700">
                      Đáp án đúng:{" "}
                      <span className="font-semibold">{item.correctAnswer}</span>
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.correct
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.correct ? "Đúng" : "Sai"} · {formatScore(item.earned)}/
                  {formatScore(item.points)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/practice/${data.examNum}`}
        className="inline-flex text-sm font-medium text-[#1d6feb] hover:underline"
      >
        Xem lại {data.examTitle} →
      </Link>
    </div>
  );
}
