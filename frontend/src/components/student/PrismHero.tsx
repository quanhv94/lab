import Image from "next/image";
import prism from "@/assets/images/lang-kinh-tan-xa.png";

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

        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl lg:max-w-none">
          <Image
            src={prism}
            alt="Tia sáng trắng đi vào lăng kính và tán sắc thành dải màu"
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
