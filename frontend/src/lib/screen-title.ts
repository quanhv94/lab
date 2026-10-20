import { getExperiment } from "@/data/experiments";
import { getHsgExercise, getHsgTopic } from "@/data/hsg";
import { parseStarRating } from "@/components/student/StarRating";

export function screenTitle(pathname: string) {
  if (pathname === "/") return "Trang chủ";
  if (pathname === "/experiments") return "Thí nghiệm";
  if (pathname.startsWith("/experiments/")) {
    const slug = pathname.split("/")[2] ?? "";
    return getExperiment(slug)?.title ?? "Thí nghiệm";
  }
  if (pathname === "/exercises") return "Bài tập HSG";
  if (pathname.startsWith("/exercises/")) {
    const [, , folder, bai] = pathname.split("/");
    const topic = folder ? getHsgTopic(folder) : null;
    if (!topic) return "Bài tập HSG";
    if (!bai) return topic.title;
    const file = bai.endsWith(".html") ? bai : `${bai}.html`;
    const found = getHsgExercise(folder, file);
    if (!found) return topic.title;
    return `${topic.title} — ${parseStarRating(found.exercise.heading).label}`;
  }
  if (pathname === "/results") return "Kết quả";
  if (pathname === "/settings") return "Cài đặt";
  if (pathname.startsWith("/html/")) return `Mô phỏng ${pathname}`;
  return pathname;
}
