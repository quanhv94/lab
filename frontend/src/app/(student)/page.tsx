import Link from "next/link";
import {
  ExperimentIcon,
  type ExperimentIconKey,
} from "@/components/student/experimentIcons";
import PrismHero from "@/components/student/PrismHero";
import { EXPERIMENTS } from "@/data/experiments";

const EXTRA_MODULES: {
  href: string;
  title: string;
  desc: string;
  iconBg: string;
  icon: ExperimentIconKey;
}[] = [
  {
    href: "/html/he-thau-kinh/index.html",
    title: "Hệ thấu kính",
    desc: "Ghép thấu kính và ảnh ghép",
    iconBg: "bg-orange-100 text-orange-600",
    icon: "lensSystem",
  },
];

const MODULES = [
  ...EXPERIMENTS.map((e) => ({
    href: `/experiments/${e.slug}`,
    title: e.title,
    desc: e.description,
    iconBg: e.iconBg,
    icon: e.icon,
  })),
  ...EXTRA_MODULES,
];

export default function StudentHomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PrismHero />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${m.iconBg} transition group-hover:scale-105`}
            >
              <ExperimentIcon name={m.icon} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{m.title}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
