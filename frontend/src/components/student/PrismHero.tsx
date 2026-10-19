export default function PrismHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a5fd4] via-[#2b78ef] to-[#4aa3ff] px-6 py-8 text-white shadow-lg shadow-blue-500/20 sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-cyan-200/20 blur-2xl" />

      <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl lg:text-[2rem]">
            Khám phá thế giới ánh sáng qua những thí nghiệm ảo tương tác!
          </h1>
          <p className="mt-3 text-sm text-blue-50/90 sm:text-base">
            Dành cho học sinh giỏi môn Khoa học tự nhiên
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <PrismIllustration />
        </div>
      </div>
    </section>
  );
}

function PrismIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      className="h-auto w-full drop-shadow-xl"
      aria-hidden
    >
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="18%" stopColor="#f97316" />
          <stop offset="36%" stopColor="#eab308" />
          <stop offset="54%" stopColor="#22c55e" />
          <stop offset="72%" stopColor="#3b82f6" />
          <stop offset="88%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* incoming beam */}
      <path
        d="M20 78 H168"
        stroke="url(#beam)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="78" r="5" fill="#fff" opacity="0.9" />

      {/* prism */}
      <path
        d="M168 48 L268 178 L168 158 Z"
        fill="url(#glass)"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      <path
        d="M168 48 L268 178"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* spectrum fan */}
      {[
        ["#ef4444", -8],
        ["#f97316", 0],
        ["#eab308", 8],
        ["#22c55e", 16],
        ["#3b82f6", 24],
        ["#8b5cf6", 32],
        ["#ec4899", 40],
      ].map(([color, dy], i) => (
        <path
          key={color}
          d={`M248 ${150 + Number(dy) * 0.15} L400 ${118 + Number(dy)}`}
          stroke={color as string}
          strokeWidth="5"
          strokeLinecap="round"
          opacity={0.85 - i * 0.04}
        />
      ))}
    </svg>
  );
}
