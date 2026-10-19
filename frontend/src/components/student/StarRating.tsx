/** Hiển thị mức độ (n*) dạng rating sao */
export function parseStarRating(heading: string) {
  const match = heading.match(/\((\d+)\*\)/);
  const stars = match ? Math.min(5, Math.max(0, Number(match[1]))) : 0;
  const label = heading
    .replace(/\s*\(\d+\*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { stars, label };
}

export default function StarRating({
  value,
  max = 5,
  size = "md",
}: {
  value: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const n = Math.min(max, Math.max(0, value));
  const px = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${n} trên ${max} sao`}
      title={`${n}*`}
    >
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${px} ${i < n ? "text-amber-400" : "text-slate-300"}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
