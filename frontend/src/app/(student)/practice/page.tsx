"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { listPracticeResults, practiceResultKeys } from "@/api";
import { Loading } from "@/components/ui";
import { PRACTICE_EXAMS } from "@/data/de-on";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function PracticeListPage() {
  const { data, isLoading } = useQuery({
    queryKey: practiceResultKeys.list(),
    queryFn: listPracticeResults,
  });

  const byExam = new Map((data ?? []).map((item) => [item.examNum, item]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đề luyện</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Làm tuần tự từ Đề số 1. Mỗi đề chỉ nộp 1 lần — đề chưa có đáp án tự
          luận sẽ tạm khóa.
        </p>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {PRACTICE_EXAMS.map((exam) => {
            const focus = exam.focus.replace(/^Chủ đề trọng tâm:\s*/i, "");
            const result = byExam.get(exam.num);
            const ready = !!exam.hasEssayKey;
            const unlocked = ready && (exam.num === 1 || byExam.has(exam.num - 1));
            const done = !!result;

            if (!ready) {
              return (
                <div
                  key={exam.num}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">
                    {exam.num}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {exam.title}
                      </span>
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                        Chờ cập nhật
                      </span>
                    </span>
                    {focus ? (
                      <span className="mt-0.5 block truncate text-sm text-[#64748b]">
                        {focus}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-amber-800/80">
                      Chưa có đáp án tự luận — tạm khóa
                    </span>
                  </span>
                  <span className="text-sm text-amber-700">Khóa</span>
                </div>
              );
            }

            if (!unlocked) {
              return (
                <div
                  key={exam.num}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 opacity-70"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-400 text-sm font-bold text-white">
                    {exam.num}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-700">
                      {exam.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Cần hoàn thành Đề số {exam.num - 1} trước
                    </span>
                  </span>
                  <span className="text-sm text-slate-400">Khóa</span>
                </div>
              );
            }

            return (
              <Link
                key={exam.num}
                href={`/practice/${exam.num}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${
                    done ? "bg-emerald-600" : "bg-[#1e4a7a]"
                  }`}
                >
                  {exam.num}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-900">
                    {exam.title}
                  </span>
                  {focus ? (
                    <span className="mt-0.5 block truncate text-sm text-[#64748b]">
                      {focus}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {done
                      ? `Đã nộp · ${formatScore(result.score)}/${formatScore(result.maxScore)}`
                      : "Chấm trắc nghiệm + tự luận · làm 1 lần"}
                  </span>
                </span>
                <span className="text-sm text-[#1d6feb]">
                  {done ? "Xem lại →" : "Làm bài →"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
