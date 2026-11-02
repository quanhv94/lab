import Link from "next/link";
import { PRACTICE_EXAMS } from "@/data/de-on";

export default function PracticeListPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đề luyện</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Đề ôn luyện HSG KHTN 9 — {PRACTICE_EXAMS.length} đề (chỉ phần đề, không
          gồm hướng dẫn chấm).
        </p>
      </div>

      <div className="space-y-2">
        {PRACTICE_EXAMS.map((exam) => {
          const focus = exam.focus.replace(/^Chủ đề trọng tâm:\s*/i, "");
          return (
            <Link
              key={exam.num}
              href={`/practice/${exam.num}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e4a7a] text-sm font-bold text-white">
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
              </span>
              <span className="text-sm text-[#1d6feb]">Mở →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
