import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PracticeExamClient from "@/components/student/PracticeExamClient";
import { Loading } from "@/components/ui";
import {
  PRACTICE_EXAMS,
  getPracticeExam,
  practiceHtmlPath,
} from "@/data/de-on";

export function generateStaticParams() {
  return PRACTICE_EXAMS.map((e) => ({ num: String(e.num) }));
}

async function PracticeExamContent({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num: raw } = await params;
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num)) notFound();

  const exam = getPracticeExam(num);
  if (!exam) notFound();

  const src = `${practiceHtmlPath(exam.file)}?embed=1`;
  const focus = exam.focus.replace(/^Chủ đề trọng tâm:\s*/i, "");

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="shrink-0">
        <Link
          href="/practice"
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại Đề luyện
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{exam.title}</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          {[exam.duration, focus].filter(Boolean).join(" · ")}
        </p>
      </div>

      <PracticeExamClient
        examNum={exam.num}
        examTitle={exam.title}
        exerciseSrc={src}
        hasEssayKey={!!exam.hasEssayKey}
      />
    </div>
  );
}

export default function PracticeExamPage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <PracticeExamContent params={params} />
    </Suspense>
  );
}
