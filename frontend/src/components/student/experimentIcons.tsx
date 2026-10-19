import type { ReactNode } from "react";

export type ExperimentIconKey =
  | "straight"
  | "reflect"
  | "refract"
  | "prism"
  | "lens"
  | "lensSystem";

const CLASS = "h-7 w-7";

export function ExperimentIcon({
  name,
}: {
  name: ExperimentIconKey;
}): ReactNode {
  switch (name) {
    case "straight":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 12h14" strokeLinecap="round" />
          <path d="M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "reflect":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 18 L12 6" strokeLinecap="round" />
          <path d="M12 6 L20 18" strokeLinecap="round" />
          <path d="M7 20h10" strokeLinecap="round" />
          <path d="M12 6v4" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );
    case "refract":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16" strokeLinecap="round" />
          <path d="M12 5v4" strokeLinecap="round" />
          <path d="M12 9 L7 20" strokeLinecap="round" />
          <path d="M3 12h18" strokeOpacity="0.35" strokeDasharray="3 3" />
        </svg>
      );
    case "prism":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 L21 20 H3 Z" strokeLinejoin="round" />
          <path d="M2 10h7" strokeLinecap="round" />
          <path d="M14 14l6-2M14 16l6 0M14 18l5 2" strokeLinecap="round" />
        </svg>
      );
    case "lens":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M2 12h6M16 12h6" strokeLinecap="round" />
        </svg>
      );
    case "lensSystem":
      return (
        <svg viewBox="0 0 24 24" className={CLASS} fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="8" cy="12" rx="3" ry="8" />
          <ellipse cx="16" cy="12" rx="3" ry="8" />
          <path d="M2 12h3M11 12h2M19 12h3" strokeLinecap="round" />
        </svg>
      );
  }
}
