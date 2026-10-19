import Link from "next/link";
import { notFound } from "next/navigation";
import HsgExerciseView from "@/components/student/HsgExerciseView";
import StarRating, { parseStarRating } from "@/components/student/StarRating";
import {
  HSG_TOPICS,
  getHsgExercise,
  hsgHtmlPath,
} from "@/data/hsg";

export function generateStaticParams() {
  return HSG_TOPICS.flatMap((t) =>
    t.exercises.map((e) => ({
      topic: t.folder,
      bai: e.file.replace(/\.html$/, ""),
    })),
  );
}

export default async function HsgExercisePage({
  params,
}: {
  params: Promise<{ topic: string; bai: string }>;
}) {
  const { topic: folder, bai } = await params;
  const file = bai.endsWith(".html") ? bai : `${bai}.html`;
  const found = getHsgExercise(folder, file);
  if (!found) notFound();

  const { topic, exercise } = found;
  const { stars, label } = parseStarRating(exercise.heading);
  const src = `${hsgHtmlPath(topic.folder, exercise.file)}?embed=1`;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="shrink-0">
        <Link
          href={`/exercises/${topic.folder}`}
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại {topic.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{label}</h1>
          {stars > 0 && <StarRating value={stars} />}
        </div>
        <p className="mt-1 text-sm text-[#64748b]">{topic.title}</p>
      </div>

      <HsgExerciseView
        exerciseSrc={src}
        exerciseTitle={exercise.heading}
        simEmbedUrl={exercise.simEmbedUrl}
      />
    </div>
  );
}
