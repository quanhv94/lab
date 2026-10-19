import Link from "next/link";
import { notFound } from "next/navigation";
import StarRating, { parseStarRating } from "@/components/student/StarRating";
import { HSG_TOPICS, getHsgTopic } from "@/data/hsg";

export function generateStaticParams() {
  return HSG_TOPICS.map((t) => ({ topic: t.folder }));
}

export default async function HsgTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: folder } = await params;
  const topic = getHsgTopic(folder);
  if (!topic) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/exercises"
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại Bài tập HSG
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{topic.title}</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          {topic.count} bài · chọn bài để xem đề
        </p>
      </div>

      <div className="space-y-2">
        {topic.exercises.map((ex) => {
          const { stars, label } = parseStarRating(ex.heading);
          return (
            <Link
              key={ex.file}
              href={`/exercises/${topic.folder}/${ex.file.replace(/\.html$/, "")}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e4a7a] text-sm font-bold text-white">
                {ex.num}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-900">{label}</span>
                {stars > 0 && (
                  <span className="mt-1 inline-flex">
                    <StarRating value={stars} size="sm" />
                  </span>
                )}
              </span>
              <span className="text-sm text-[#1d6feb]">Mở →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
