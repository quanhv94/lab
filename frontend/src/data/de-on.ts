import manifest from "@/data/de-on-manifest.json";

export type PracticeExam = {
  num: number;
  title: string;
  file: string;
  source: string;
  subject: string;
  focus: string;
  duration: string;
};

export const PRACTICE_EXAMS = manifest.exams as PracticeExam[];

export function getPracticeExam(num: number) {
  return PRACTICE_EXAMS.find((e) => e.num === num) ?? null;
}

export function practiceHtmlPath(file: string) {
  return `/html/de-on/${file}`;
}
