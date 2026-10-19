import Link from "next/link";
import { ExperimentIcon } from "@/components/student/experimentIcons";
import { EXPERIMENTS } from "@/data/experiments";

export default function ExperimentsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thí nghiệm</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Chọn thí nghiệm để dự đoán, thực hành và rút kết luận.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXPERIMENTS.map((e) => (
          <Link
            key={e.slug}
            href={`/experiments/${e.slug}`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${e.iconBg} transition group-hover:scale-105`}
            >
              <ExperimentIcon name={e.icon} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{e.title}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{e.description}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-[#1d6feb] group-hover:underline">
              Mở thí nghiệm →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
