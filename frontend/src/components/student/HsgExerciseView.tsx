"use client";

import { useState } from "react";
import AutoHeightIframe from "@/components/student/AutoHeightIframe";

function embedSrc(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}embed=1`;
}

export default function HsgExerciseView({
  exerciseSrc,
  exerciseTitle,
  simEmbedUrl,
}: {
  exerciseSrc: string;
  exerciseTitle: string;
  simEmbedUrl?: string;
}) {
  const [showSim, setShowSim] = useState(false);

  if (!simEmbedUrl) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-sky-200 bg-white shadow-sm">
        <AutoHeightIframe
          src={exerciseSrc}
          title={exerciseTitle}
          showFullscreen={false}
          fill
        />
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="min-h-0 overflow-hidden rounded-2xl border-2 border-sky-200 bg-white shadow-sm">
        <AutoHeightIframe
          src={exerciseSrc}
          title={exerciseTitle}
          showFullscreen={false}
          fill
        />
      </div>

      {showSim ? (
        <div className="min-h-0 overflow-hidden rounded-2xl border-2 border-sky-200 bg-white shadow-sm">
          <AutoHeightIframe
            src={embedSrc(simEmbedUrl)}
            title={`Mô phỏng — ${exerciseTitle}`}
            fill
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSim(true)}
          className="h-fit w-fit cursor-pointer rounded-xl bg-[#1e4a7a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163a63]"
        >
          Hiện mô phỏng
        </button>
      )}
    </div>
  );
}
