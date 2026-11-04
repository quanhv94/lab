import type { PracticeResultSummary } from "@/api";

function pctOf(item: PracticeResultSummary) {
  if (item.maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, (item.score / item.maxScore) * 100));
}

function barColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default function ResultsScoreChart({
  results,
  fill = false,
}: {
  results: PracticeResultSummary[];
  fill?: boolean;
}) {
  const byExam = new Map<number, PracticeResultSummary>();
  for (const item of results) {
    const prev = byExam.get(item.examNum);
    if (!prev || new Date(item.submittedAt) > new Date(prev.submittedAt)) {
      byExam.set(item.examNum, item);
    }
  }

  const rows = [...byExam.values()].sort((a, b) => a.examNum - b.examNum);
  if (!rows.length) return null;

  return (
    <section
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
        fill ? "min-h-0 h-full" : ""
      }`}
    >
      <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Biểu đồ kết quả theo đề
          </h2>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Phần trăm điểm từng đề đã nộp
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> ≥ 80%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> 50–79%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> &lt; 50%
          </span>
        </div>
      </div>

      <div
        className={`flex items-end gap-2 sm:gap-4 ${
          fill ? "min-h-0 flex-1" : "h-56"
        }`}
        role="img"
        aria-label="Biểu đồ cột phần trăm điểm theo đề"
      >
        {rows.map((item) => {
          const pct = pctOf(item);
          return (
            <div
              key={item.examNum}
              className="flex h-full min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="shrink-0 text-sm font-semibold text-slate-700">
                {pct.toFixed(0)}%
              </span>
              <div className="relative w-full flex-1 rounded-md bg-slate-100">
                <div
                  className={`absolute inset-x-1 bottom-0 rounded-t-md sm:inset-x-2 ${barColor(pct)}`}
                  style={{ height: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                  title={`${item.examTitle}: ${pct.toFixed(0)}%`}
                />
              </div>
              <span className="shrink-0 text-center text-xs font-medium text-slate-600 sm:text-sm">
                Đề {item.examNum}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
