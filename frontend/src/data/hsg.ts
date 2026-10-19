import manifest from "@/data/hsg-manifest.json";

export type HsgExercise = {
  num: number;
  heading: string;
  file: string;
  /** Optional optics sim under /html/... */
  simEmbedUrl?: string;
};

/** Mô phỏng gắn theo bài HSG (topic/file → đường dẫn /html/...) */
export const HSG_SIM_EMBEDS: Record<string, string> = {
  "truyen-thang-anh-sang/bai-1.html":
    "/html/truyen-thang-anh-sang/bong-cot-den.html",
  "truyen-thang-anh-sang/bai-2.html":
    "/html/truyen-thang-anh-sang/vung-toi-nua-toi.html",
  "phan-xa-anh-sang/bai-3.html": "/html/phan-xa-anh-sang/he-2-guong.html",
  "phan-xa-anh-sang/bai-4.html": "/html/phan-xa-anh-sang/ba-guong.html",
  "phan-xa-anh-sang/bai-6.html": "/html/phan-xa-anh-sang/hai-diem-guong.html",
  "khuc-xa-anh-sang/bai-2.html": "/html/khuc-xa-anh-sang/khuc-xa-mat-cau.html",
  "khuc-xa-anh-sang/bai-3.html": "/html/khuc-xa-anh-sang/binh-nuoc-nghieng.html",
  "lang-kinh/bai-2.html": "/html/lang-kinh/lang-kinh-thay-doi-duoc.html",
  "lang-kinh/bai-3.html": "/html/lang-kinh/lang-kinh-thay-doi-duoc.html",
  "thau-kinh/bai-1.html": "/html/thau-kinh/thau-kinh-hoi-tu.html",
  "thau-kinh/bai-5.html": "/html/thau-kinh/thau-kinh-hoi-tu.html",
  "he-thau-kinh/bai-2.html": "/html/he-thau-kinh/he-2-TKHT.html",
};

export type HsgTopic = {
  folder: string;
  title: string;
  count: number;
  exercises: HsgExercise[];
};

export const HSG_TOPICS = manifest.topics as HsgTopic[];

export function getHsgTopic(folder: string) {
  return HSG_TOPICS.find((t) => t.folder === folder) ?? null;
}

export function getHsgExercise(folder: string, file: string) {
  const topic = getHsgTopic(folder);
  if (!topic) return null;
  const base = topic.exercises.find((e) => e.file === file) ?? null;
  if (!base) return null;
  const simEmbedUrl = HSG_SIM_EMBEDS[`${folder}/${file}`];
  const exercise: HsgExercise = simEmbedUrl
    ? { ...base, simEmbedUrl }
    : base;
  return { topic, exercise };
}

export function hsgHtmlPath(folder: string, file = "index.html") {
  return `/html/hsg/${folder}/${file}`;
}
