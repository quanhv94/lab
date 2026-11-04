import { Suspense } from "react";
import { Loading } from "@/components/ui";
import ResultDetailClient from "./ResultDetailClient";

/** Runtime Mongo ids — no generateStaticParams; allow blocking validation. */
export const instant = false;

async function ResultDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultDetailClient id={id} />;
}

export default function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ResultDetail params={params} />
    </Suspense>
  );
}
