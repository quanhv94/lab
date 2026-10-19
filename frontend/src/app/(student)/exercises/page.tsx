import Link from "next/link";
import { ExperimentIcon } from "@/components/student/experimentIcons";
import { HSG_TOPICS } from "@/data/hsg";

const TOPIC_ICONS = [
  "straight",
  "reflect",
  "refract",
  "prism",
  "lens",
  "lensSystem",
] as const;

const TOPIC_COLORS = [
  "bg-sky-100 text-sky-600",
  "bg-emerald-100 text-emerald-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-indigo-100 text-indigo-600",
  "bg-orange-100 text-orange-600",
] as const;

export default function ExercisesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bài tập HSG</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Bài tập học sinh giỏi Quang học — chọn chủ đề để mở danh sách bài.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {HSG_TOPICS.map((topic, i) => (
          <Link
            key={topic.folder}
            href={`/exercises/${topic.folder}`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${TOPIC_COLORS[i % TOPIC_COLORS.length]} transition group-hover:scale-105`}
            >
              <ExperimentIcon name={TOPIC_ICONS[i % TOPIC_ICONS.length]!} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{topic.title}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{topic.count} bài tập</p>
            <span className="mt-4 inline-flex text-sm font-medium text-[#1d6feb] group-hover:underline">
              Mở thư mục →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
