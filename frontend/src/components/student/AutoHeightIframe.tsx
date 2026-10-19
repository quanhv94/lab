"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Fixed 16:9 embed frame with optional fullscreen control. */
export default function AutoHeightIframe({
  src,
  title,
  showFullscreen = true,
  fill = false,
}: {
  src: string;
  title: string;
  showFullscreen?: boolean;
  /** Stretch to the parent panel instead of a nested 16:9 frame. */
  fill?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!showFullscreen) return;
    function onChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [showFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser may block fullscreen without gesture / unsupported.
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-white ${
        isFullscreen || fill ? "h-full" : "aspect-video rounded-xl"
      }`}
    >
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen={showFullscreen}
      />
      {showFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-3 bottom-3 z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1e4a7a] px-5 py-3 text-lg font-semibold text-white shadow-md hover:bg-[#163a63]"
          aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? (
            <>
              <ExitFullscreenIcon />
              Thoát
            </>
          ) : (
            <>
              <FullscreenIcon />
              Toàn màn hình
            </>
          )}
        </button>
      )}
    </div>
  );
}

function FullscreenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3"
        strokeLinecap="round"
      />
    </svg>
  );
}
