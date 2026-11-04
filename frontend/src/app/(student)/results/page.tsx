"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { listPracticeResults, practiceResultKeys } from "@/api";
import ResultsScoreChart from "@/components/student/ResultsScoreChart";
import { Loading } from "@/components/ui";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ResultsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: practiceResultKeys.list(),
    queryFn: listPracticeResults,
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-5">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Kết quả</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Lịch sử nộp bài đề luyện — điểm số và chi tiết từng lần làm.
        </p>
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(error as Error).message || "Không tải được kết quả"}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => void refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : !data?.length ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div>
            <p className="text-slate-700">Chưa có kết quả nào.</p>
            <Link
              href="/practice"
              className="mt-4 inline-flex text-sm font-medium text-[#1d6feb] hover:underline"
            >
              Làm đề luyện →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ResultsScoreChart results={data} fill />

          <div className="flex min-h-0 flex-col gap-2 overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-1">
              <h2 className="text-sm font-bold text-slate-900">
                Chi tiết các lần nộp
              </h2>
              {isFetching && (
                <p className="text-xs text-slate-400">Đang cập nhật...</p>
              )}
            </div>
            {data.map((item) => {
              const pct =
                item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
              return (
                <Link
                  key={item.id}
                  href={`/results/${item.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1e4a7a] text-white">
                    <span className="text-[10px] font-medium opacity-80">
                      Đề
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {item.examNum}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">
                      {item.examTitle}
                    </span>
                    <span className="mt-0.5 block text-sm text-[#64748b]">
                      {formatWhen(item.submittedAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-base font-bold text-slate-900">
                      {formatScore(item.score)}
                      <span className="text-sm font-medium text-slate-500">
                        /{formatScore(item.maxScore)}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        pct >= 80
                          ? "text-emerald-600"
                          : pct >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
