"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  createElement,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AutoHeightIframe from "@/components/student/AutoHeightIframe";
import ketQuaThauKinhHoiTu from "@/assets/images/ket_qua_thau_kinh_hoi_tu.png";
import type { Experiment, ExperimentSection } from "@/data/experiments";

function embedSrc(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}embed=1`;
}

const SECTION_IMAGES: Record<string, StaticImageData> = {
  ket_qua_thau_kinh_hoi_tu: ketQuaThauKinhHoiTu,
};

type SectionTheme = {
  card: string;
  header: string;
  title: string;
  body: string;
  accent: string;
  control: string;
  controlFocus: string;
  chip: string;
  chipHover: string;
  chipOpen: string;
};

/** Đồng bộ màu với mục 2 (thí nghiệm): nền sky, đầu mục đậm hơn */
function sectionTheme(_section: ExperimentSection): SectionTheme {
  return {
    card: "border-2 border-sky-200 bg-[#e8f1fb]",
    header: "bg-[#1e4a7a]",
    title: "text-white",
    body: "text-sky-950/90",
    accent: "bg-[#3b82f6] text-white",
    control:
      "border-2 border-sky-300 bg-white hover:border-sky-400 hover:bg-sky-50 focus:border-sky-400 focus:ring-2 focus:ring-sky-200",
    controlFocus:
      "border-2 border-sky-500 bg-sky-200 text-sky-950 ring-2 ring-sky-300",
    chip: "border-sky-300 bg-white text-sky-900 hover:bg-sky-50",
    chipHover: "",
    chipOpen: "border-t-2 border-sky-300 bg-white text-sky-950",
  };
}

function SectionHeading({
  title,
  theme,
}: {
  title: string;
  theme: SectionTheme;
}) {
  const num = title.match(/^(\d+)\./)?.[1];
  const label = num ? title.replace(/^\d+\.\s*/, "") : title;
  return (
    <div className={`px-4 py-3 ${theme.header}`}>
      <h2
        className={`flex items-center gap-3 text-lg font-extrabold ${theme.title}`}
      >
        {num && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${theme.accent}`}
            aria-hidden
          >
            {num}
          </span>
        )}
        {!num && (
          <span
            className={`inline-block h-3 w-3 shrink-0 rounded-full ${theme.accent}`}
            aria-hidden
          />
        )}
        {label}
      </h2>
    </div>
  );
}

function SectionShell({
  theme,
  title,
  children,
  className = "",
}: {
  theme: SectionTheme;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl shadow-sm ${theme.card} ${className}`}
    >
      <SectionHeading title={title} theme={theme} />
      <div className="p-5">{children}</div>
    </section>
  );
}

type BlankDef = { id: string; answer: string };

type BlankPart =
  | { type: "text"; value: string }
  | { type: "blank"; id: string; answer: string };

function isHtmlStatement(text: string) {
  return /<[a-z][\s\S]*>/i.test(text);
}

function parseBlankStatement(text: string, prefix: string): BlankPart[] {
  const parts: BlankPart[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let blankIndex = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({
      type: "blank",
      id: `${prefix}:${blankIndex++}`,
      answer: match[1] ?? "",
    });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}

/** Replace [answer] with marker spans; collect blank defs. */
function injectBlankMarkers(source: string, prefix: string) {
  const blanks: BlankDef[] = [];
  let blankIndex = 0;
  const html = source.replace(/\[([^\]]+)\]/g, (_m, answer: string) => {
    const id = `${prefix}:${blankIndex++}`;
    blanks.push({ id, answer });
    return `<span data-qh-blank="${id}"></span>`;
  });
  return { html, blanks };
}

function normalizeBlankAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function BlankInput({
  id,
  answer,
  value,
  checked,
  onChange,
}: {
  id: string;
  answer: string;
  value: string;
  checked: boolean;
  onChange: (id: string, value: string) => void;
}) {
  const ok =
    checked &&
    normalizeBlankAnswer(value) === normalizeBlankAnswer(answer);
  const wrong = checked && !ok;
  return (
    <span className="mx-0.5 inline-flex items-baseline gap-1 align-baseline">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        size={Math.max(answer.length, 3) + 1}
        className={`mx-0.5 inline-block min-w-[2.5rem] rounded-md border-b-2 bg-white/80 px-1.5 py-0.5 text-center font-semibold outline-none ${
          ok
            ? "border-green-500 bg-green-50 text-green-700"
            : wrong
              ? "border-red-500 bg-red-50 text-red-600 line-through"
              : "border-sky-400 text-sky-950 focus:border-[#1e4a7a]"
        }`}
        aria-label="Ô trống"
      />
      {wrong && (
        <span className="font-semibold text-green-700">{answer}</span>
      )}
    </span>
  );
}

function domNodeToReact(
  node: Node,
  blankAnswers: Map<string, string>,
  values: Record<string, string>,
  checked: boolean,
  onChange: (id: string, value: string) => void,
  key: string,
): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;
  const blankId = el.getAttribute("data-qh-blank");
  if (blankId) {
    return (
      <BlankInput
        key={blankId}
        id={blankId}
        answer={blankAnswers.get(blankId) ?? ""}
        value={values[blankId] ?? ""}
        checked={checked}
        onChange={onChange}
      />
    );
  }

  const tag = el.tagName.toLowerCase();
  // Keep MathML subtree intact (no blanks inside).
  if (tag === "math") {
    return (
      <span
        key={key}
        className="inline-block align-middle"
        dangerouslySetInnerHTML={{ __html: el.outerHTML }}
      />
    );
  }

  const children = Array.from(el.childNodes).map((child, i) =>
    domNodeToReact(
      child,
      blankAnswers,
      values,
      checked,
      onChange,
      `${key}-${i}`,
    ),
  );

  const props: Record<string, unknown> = { key };
  if (tag === "a" && el.hasAttribute("href")) {
    props.href = el.getAttribute("href");
  }

  return createElement(tag, props, ...children);
}

function HtmlBlankStatement({
  html,
  blanks,
  values,
  checked,
  onChange,
}: {
  html: string;
  blanks: BlankDef[];
  values: Record<string, string>;
  checked: boolean;
  onChange: (id: string, value: string) => void;
}) {
  const blankAnswers = new Map(blanks.map((b) => [b.id, b.answer]));
  const nodes = useMemo(() => {
    if (typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString(
      `<div id="qh-root">${html}</div>`,
      "text/html",
    );
    return doc.getElementById("qh-root");
  }, [html]);

  if (!nodes) {
    return null;
  }

  return (
    <>
      {Array.from(nodes.childNodes).map((child, i) =>
        domNodeToReact(
          child,
          blankAnswers,
          values,
          checked,
          onChange,
          `html-${i}`,
        ),
      )}
    </>
  );
}

function ConclusionFillBlanks({
  statements,
  slug,
  theme,
}: {
  statements: string[];
  slug: string;
  theme: SectionTheme;
}) {
  const prepared = statements.map((s, i) => {
    const prefix = `${slug}:conclusion:${i}`;
    if (isHtmlStatement(s)) {
      const { html, blanks } = injectBlankMarkers(s, prefix);
      return { kind: "html" as const, html, blanks, index: i };
    }
    return {
      kind: "plain" as const,
      parts: parseBlankStatement(s, prefix),
      blanks: parseBlankStatement(s, prefix).filter(
        (p): p is Extract<BlankPart, { type: "blank" }> => p.type === "blank",
      ),
      index: i,
    };
  });

  const blankIds = prepared.flatMap((row) => row.blanks);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const onBlankChange = (id: string, value: string) => {
    setChecked(false);
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const hasBlanks = blankIds.length > 0;
  const correctCount = blankIds.filter(
    (b) =>
      normalizeBlankAnswer(values[b.id] ?? "") ===
      normalizeBlankAnswer(b.answer),
  ).length;
  const scorePercent =
    blankIds.length > 0
      ? Math.round((correctCount / blankIds.length) * 100)
      : 0;

  return (
    <div>
      <div className={`space-y-3 font-medium ${theme.body}`}>
        {prepared.map((row) => {
          if (row.kind === "html") {
            return (
              <div
                key={`${slug}:conclusion-html:${row.index}`}
                className="conclusion-rich leading-relaxed [&_p]:mb-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_math]:my-2 [&_math]:block [&_strong]:font-bold"
              >
                <HtmlBlankStatement
                  html={row.html}
                  blanks={row.blanks}
                  values={values}
                  checked={checked}
                  onChange={onBlankChange}
                />
              </div>
            );
          }
          return (
            <div
              key={`${slug}:conclusion-plain:${row.index}`}
              className="flex gap-2 leading-relaxed"
            >
              <span className="select-none" aria-hidden>
                •
              </span>
              <p className="min-w-0 flex-1">
                {row.parts.map((part, j) => {
                  if (part.type === "text") {
                    return <span key={`t-${j}`}>{part.value}</span>;
                  }
                  return (
                    <BlankInput
                      key={part.id}
                      id={part.id}
                      answer={part.answer}
                      value={values[part.id] ?? ""}
                      checked={checked}
                      onChange={onBlankChange}
                    />
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
      {hasBlanks && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="cursor-pointer rounded-xl bg-[#1e4a7a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163a63]"
          >
            Kiểm tra kết quả
          </button>
          {checked && (
            <p
              className={`text-base font-bold ${
                scorePercent === 100
                  ? "text-green-700"
                  : scorePercent >= 50
                    ? "text-amber-700"
                    : "text-red-600"
              }`}
            >
              Điểm: {scorePercent}% ({correctCount}/{blankIds.length})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExperimentDetail({
  experiment,
}: {
  experiment: Experiment;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const isRightSection = (s: ExperimentSection) =>
    s.type === "experiment" || s.title.startsWith("5.");
  const leftSections = experiment.sections.filter((s) => !isRightSection(s));
  const rightSections = experiment.sections.filter(isRightSection);

  function renderSection(section: ExperimentSection): ReactNode {
    const theme = sectionTheme(section);

    if (section.type === "predict") {
      const key = `${experiment.slug}:predict`;
      return (
        <SectionShell key={section.title} title={section.title} theme={theme}>
          <p className={`font-medium ${theme.body}`}>{section.question}</p>
          {section.options.length > 0 && (
            <div className="mt-4 space-y-2">
              {section.options.map((opt) => {
                const selected = answers[key] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      selected ? theme.controlFocus : theme.control
                    }`}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={opt.id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [key]: opt.id }))
                      }
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </SectionShell>
      );
    }

    if (section.type === "experiment") {
      return (
        <SectionShell
          key={section.title}
          title={section.title}
          theme={theme}
          className="flex h-full min-h-0 flex-col"
        >
          {section.embedUrl ? (
            <div
              className={`overflow-hidden rounded-xl bg-white shadow-inner ${theme.control}`}
            >
              <AutoHeightIframe
                src={embedSrc(section.embedUrl)}
                title={section.title}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sky-300 bg-white/70 px-4 py-10 text-center text-sm text-sky-700">
              {section.content ?? "Khu vực thực nghiệm sẽ được bổ sung."}
            </div>
          )}
        </SectionShell>
      );
    }

    if (section.type === "qa") {
      return (
        <SectionShell key={section.title} title={section.title} theme={theme}>
          <div className="space-y-5">
            {section.questions.map((q, i) => {
              const key = `${experiment.slug}:${section.title}:${i}`;
              return (
                <div key={key}>
                  <p className={`font-medium ${theme.body}`}>
                    {section.questions.length > 1 ? `${i + 1}. ` : ""}
                    {q}
                  </p>
                  <textarea
                    value={answers[key] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Nhập câu trả lời..."
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 outline-none ${theme.control}`}
                  />
                </div>
              );
            })}
          </div>
        </SectionShell>
      );
    }

    if (section.type === "image") {
      const src = SECTION_IMAGES[section.imageKey];
      const questions = section.questions ?? [];
      return (
        <SectionShell key={section.title} title={section.title} theme={theme}>
          {src ? (
            <div className="overflow-hidden rounded-xl border-2 border-sky-200 bg-white shadow-sm">
              <Image
                src={src}
                alt={section.alt ?? section.title}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          ) : (
            <p className={`text-sm ${theme.body}`}>Ảnh chưa được bổ sung.</p>
          )}
          {questions.length > 0 && (
            <ul className={`mt-5 list-disc space-y-2 pl-5 ${theme.body}`}>
              {questions.map((q) => (
                <li key={q} className="font-medium">
                  {q}
                </li>
              ))}
            </ul>
          )}
        </SectionShell>
      );
    }

    const hasBlanks = section.statements.some((s) => /\[[^\]]+\]/.test(s));
    if (hasBlanks) {
      return (
        <SectionShell key={section.title} title={section.title} theme={theme}>
          <ConclusionFillBlanks
            statements={section.statements}
            slug={experiment.slug}
            theme={theme}
          />
        </SectionShell>
      );
    }

    return (
      <SectionShell key={section.title} title={section.title} theme={theme}>
        <ul className={`list-disc space-y-2 pl-5 font-medium ${theme.body}`}>
          {section.statements.map((s, i) => {
            const key = `${experiment.slug}:conclusion:${i}`;
            if (/<[a-z][\s\S]*>/i.test(s)) {
              return (
                <li key={key}>
                  <div
                    className="conclusion-rich leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_math]:my-2 [&_math]:block"
                    dangerouslySetInnerHTML={{ __html: s }}
                  />
                </li>
              );
            }
            return (
              <li key={key} className="leading-relaxed">
                {s}
              </li>
            );
          })}
        </ul>
      </SectionShell>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="shrink-0">
        <Link
          href="/experiments"
          className="text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại Thí nghiệm
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,2fr)_minmax(420px,3fr)]">
        <div className="col-span-full flex flex-col items-center text-center">
          <h1 className="inline-flex rounded-xl border-2 border-[#1e4a7a] bg-[#1e4a7a] px-4 py-2.5 text-[2.0625rem] font-extrabold uppercase leading-tight tracking-wide text-white shadow-sm">
            {experiment.title}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {experiment.description}
          </p>
        </div>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          {leftSections.map(renderSection)}
        </div>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:sticky lg:top-0 lg:self-start">
          {rightSections.map(renderSection)}
        </div>
      </div>
    </div>
  );
}
