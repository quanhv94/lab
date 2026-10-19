import { notFound } from "next/navigation";
import { EXPERIMENTS, getExperiment } from "@/data/experiments";
import ExperimentDetail from "./ExperimentDetail";

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment) notFound();
  return <ExperimentDetail experiment={experiment} />;
}
