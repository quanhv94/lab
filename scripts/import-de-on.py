#!/usr/bin/env python3
"""Convert de_on/*.docx → frontend/src/html/de-on/*.html (exam body only)."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "de_on"
OUT = ROOT / "frontend" / "src" / "html" / "de-on"
MANIFEST = ROOT / "frontend" / "src" / "data" / "de-on-manifest.json"

CUT_RE = re.compile(r"HƯỚNG\s+DẪN\s+CHẤM", re.IGNORECASE)
ANSWER_SHEET_HINT = re.compile(r"điền\s+đáp\s+án\s+vào\s+bảng", re.I)


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def run_to_html(r: ET.Element) -> str:
    texts: list[str] = []
    vert = None
    bold = False
    italic = False
    rPr = r.find(W + "rPr")
    if rPr is not None:
        bold = rPr.find(W + "b") is not None and rPr.find(W + "b").get(W + "val", "true") != "0"
        italic = rPr.find(W + "i") is not None and rPr.find(W + "i").get(W + "val", "true") != "0"
        va = rPr.find(W + "vertAlign")
        if va is not None:
            vert = va.get(W + "val")

    for child in r:
        tag = local(child.tag)
        if tag == "t" and child.text:
            texts.append(html.escape(child.text))
        elif tag == "tab":
            texts.append("\t")
        elif tag == "br":
            texts.append("<br/>")
    if not texts:
        return ""
    s = "".join(texts)
    if bold:
        s = f"<strong>{s}</strong>"
    if italic:
        s = f"<em>{s}</em>"
    if vert == "subscript":
        s = f"<sub>{s}</sub>"
    elif vert == "superscript":
        s = f"<sup>{s}</sup>"
    return s


def para_text_plain(p: ET.Element) -> str:
    parts: list[str] = []
    for t in p.iter(W + "t"):
        if t.text:
            parts.append(t.text)
    return "".join(parts).strip()


def para_to_html(p: ET.Element) -> str | None:
    chunks: list[str] = []
    for child in p:
        tag = local(child.tag)
        if tag == "r":
            chunks.append(run_to_html(child))
        elif tag == "hyperlink":
            for r in child.findall(W + "r"):
                chunks.append(run_to_html(r))
    inner = "".join(chunks).strip()
    if not inner:
        return None
    plain = para_text_plain(p)
    cls = ""
    if plain.startswith("PHẦN ") or re.match(r"^[IVX]+\.\s", plain):
        cls = ' class="section"'
    elif re.match(r"^Câu\s+", plain):
        cls = ' class="question"'
    elif plain.startswith("----") or (
        "HẾT" in plain
        and set(plain.replace("HẾT", "").replace("-", "").replace(" ", "")) == set()
    ):
        cls = ' class="end"'
    return f"<p{cls}>{inner}</p>"


def table_to_html(tbl: ET.Element, *, header_style: bool = False) -> str:
    rows_html: list[str] = []
    for tr in tbl.findall(W + "tr"):
        cells: list[str] = []
        for tc in tr.findall(W + "tc"):
            paras = [para_to_html(p) for p in tc.findall(W + "p")]
            paras = [x for x in paras if x]
            cell_inner = "".join(paras) if paras else "&nbsp;"
            cells.append(f"<td>{cell_inner}</td>")
        rows_html.append("<tr>" + "".join(cells) + "</tr>")
    css = ' class="exam-header"' if header_style else ""
    return f"<table{css}>" + "".join(rows_html) + "</table>"


def extract_meta(body_kids: list[ET.Element]) -> dict[str, str]:
    meta = {"title_line": "", "subject": "", "focus": "", "duration": ""}
    if not body_kids or local(body_kids[0].tag) != "tbl":
        return meta
    tbl = body_kids[0]
    tr = tbl.find(W + "tr")
    if tr is None:
        return meta
    tcs = tr.findall(W + "tc")
    left_paras: list[str] = []
    right_paras: list[str] = []
    if len(tcs) >= 1:
        left_paras = [para_text_plain(p) for p in tcs[0].findall(W + "p") if para_text_plain(p)]
    if len(tcs) >= 2:
        right_paras = [para_text_plain(p) for p in tcs[1].findall(W + "p") if para_text_plain(p)]
    for line in left_paras:
        if "ĐỀ ÔN LUYỆN" in line.upper() or "ĐỀ ÔN" in line.upper():
            meta["title_line"] = line
    for line in right_paras:
        if line.startswith("Môn:"):
            meta["subject"] = line
        elif line.startswith("Thời gian"):
            meta["duration"] = line
        elif line.startswith("Chủ đề"):
            meta["focus"] = line
    return meta


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


def para_inner(block: str) -> str | None:
    m = re.fullmatch(r"<p(?:\s[^>]*)?>(.*)</p>", block, flags=re.S)
    return m.group(1) if m else None


def parse_inline_abcd(inner: str) -> list[tuple[str, str]] | None:
    parts = re.split(r"<strong>([A-D])\.</strong>\s*", inner)
    if len(parts) < 3:
        return None
    opts: list[tuple[str, str]] = []
    i = 1
    while i + 1 < len(parts):
        letter = parts[i]
        text = parts[i + 1].strip(" \t")
        text = re.sub(r"(\t| {2,})+$", "", text)
        opts.append((letter, text))
        i += 2
    return opts if len(opts) >= 2 else None


def parse_single_abcd(inner: str) -> tuple[str, str] | None:
    m = re.match(r"<strong>([A-D])\.</strong>\s*(.*)$", inner, flags=re.S)
    if not m:
        return None
    return m.group(1), m.group(2).strip()


def parse_tf_item(inner: str) -> tuple[str, str] | None:
    m = re.match(r"<strong>([a-d])\)</strong>\s*(.*)$", inner, flags=re.S)
    if not m:
        return None
    return m.group(1), m.group(2).strip()


def render_mcq_options(name: str, opts: list[tuple[str, str]]) -> str:
    items = []
    for letter, text in opts:
        oid = f"{name}-{letter}"
        items.append(
            f'<label class="option" for="{html.escape(oid)}">'
            f'<input type="radio" name="{html.escape(name)}" id="{html.escape(oid)}" value="{html.escape(letter)}" />'
            f'<span class="opt-key">{html.escape(letter)}.</span>'
            f'<span class="opt-text">{text}</span>'
            f"</label>"
        )
    return '<div class="options" role="radiogroup">' + "".join(items) + "</div>"


def render_tf_item(name: str, letter: str, text: str) -> str:
    yes_id = f"{name}-dung"
    no_id = f"{name}-sai"
    return (
        f'<div class="tf-item">'
        f'<div class="tf-stem"><strong>{html.escape(letter)})</strong> {text}</div>'
        f'<div class="tf-choices" role="radiogroup" aria-label="Ý {html.escape(letter)}">'
        f'<label class="tf-choice" for="{html.escape(yes_id)}">'
        f'<input type="radio" name="{html.escape(name)}" id="{html.escape(yes_id)}" value="Đúng" />'
        f"<span>Đúng</span></label>"
        f'<label class="tf-choice" for="{html.escape(no_id)}">'
        f'<input type="radio" name="{html.escape(name)}" id="{html.escape(no_id)}" value="Sai" />'
        f"<span>Sai</span></label>"
        f"</div></div>"
    )


def enhance_interactive(blocks: list[str]) -> str:
    """Turn MCQ A–D and Đúng/Sai items into radio controls; drop blank answer sheet."""
    out: list[str] = []
    mode = "none"  # none | mcq | tf | other
    skip_next_table = False
    mcq_q: str | None = None
    mcq_opts: list[tuple[str, str]] = []
    current_qnum: str | None = None

    def flush_mcq() -> None:
        nonlocal mcq_q, mcq_opts
        if mcq_q is None:
            return
        out.append(mcq_q)
        if mcq_opts and current_qnum is not None:
            out.append(render_mcq_options(f"mcq-{current_qnum}", mcq_opts))
        mcq_q = None
        mcq_opts = []

    for block in blocks:
        plain = strip_tags(block).strip()

        if ANSWER_SHEET_HINT.search(plain):
            skip_next_table = True
            continue

        if block.startswith("<table") and "exam-header" not in block:
            if skip_next_table:
                skip_next_table = False
                continue

        if 'class="section"' in block or block.startswith("<p class=\"section\""):
            flush_mcq()
            if re.search(r"nhiều phương án lựa chọn", plain, re.I):
                mode = "mcq"
            elif re.search(r"đúng sai", plain, re.I):
                mode = "tf"
            elif re.search(r"PHẦN B|trả lời ngắn", plain, re.I):
                mode = "other"
            elif re.search(r"^I\.\s", plain) and "trắc nghiệm" in plain.lower():
                mode = "mcq"
            elif re.search(r"^II\.\s", plain) and "đúng" in plain.lower():
                mode = "tf"
            out.append(block)
            continue

        inner = para_inner(block)

        if mode == "mcq" and inner is not None:
            q = re.match(r"<strong>Câu\s+(\d+)\.</strong>", inner)
            if q:
                flush_mcq()
                current_qnum = q.group(1)
                mcq_q = block
                continue

            inline = parse_inline_abcd(inner)
            if inline and mcq_q is not None:
                mcq_opts = inline
                flush_mcq()
                continue

            single = parse_single_abcd(inner)
            if single and mcq_q is not None:
                mcq_opts.append(single)
                if single[0] == "D":
                    flush_mcq()
                continue

            flush_mcq()
            out.append(block)
            continue

        if mode == "tf" and inner is not None:
            flush_mcq()
            q = re.match(r"<strong>Câu\s+(\d+)\.</strong>", inner)
            if q:
                current_qnum = q.group(1)
                out.append(block)
                continue
            item = parse_tf_item(inner)
            if item and current_qnum is not None:
                letter, text = item
                out.append(render_tf_item(f"tf-{current_qnum}-{letter}", letter, text))
                continue
            out.append(block)
            continue

        flush_mcq()
        out.append(block)

    flush_mcq()
    return "\n".join(out)


INTERACTIVE_CSS = """
.options { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 16px; }
.option {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; background: #fff; transition: border-color .15s, background .15s;
}
.option:hover { border-color: #93c5fd; background: #f8fbff; }
.option:has(input:checked) { border-color: #3b82f6; background: #eff6ff; }
.option input { margin-top: 4px; accent-color: #2563eb; flex-shrink: 0; }
.opt-key { font-weight: 700; color: #0b1f3a; min-width: 1.4em; }
.opt-text { flex: 1; }
.tf-item {
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px;
  margin: 8px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff;
}
.tf-stem { flex: 1 1 240px; min-width: 0; }
.tf-choices { display: flex; gap: 8px; flex-shrink: 0; margin-left: auto; }
.tf-choice {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 999px;
  cursor: pointer; font-weight: 600; font-size: 14px; background: #f8fafc;
}
.tf-choice:hover { border-color: #93c5fd; background: #f0f7ff; }
.tf-choice:has(input:checked) { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }
.tf-choice input { accent-color: #2563eb; }
"""


def convert_docx(path: Path) -> tuple[str, dict]:
    with ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    assert body is not None
    kids = [c for c in list(body) if local(c.tag) != "sectPr"]

    cut = len(kids)
    for i, c in enumerate(kids):
        if local(c.tag) == "p" and CUT_RE.search(para_text_plain(c)):
            cut = i
            break

    meta = extract_meta(kids)
    parts: list[str] = []
    for i, c in enumerate(kids[:cut]):
        tag = local(c.tag)
        if tag == "p":
            h = para_to_html(c)
            if h:
                parts.append(h)
        elif tag == "tbl":
            parts.append(table_to_html(c, header_style=(i == 0)))

    num_m = re.search(r"so_(\d+)", path.stem, re.I) or re.search(r"(\d+)", path.stem)
    num = int(num_m.group(1)) if num_m else 0
    title = f"Đề số {num}"
    content = enhance_interactive(parts)
    page = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(title)} — Đề luyện HSG KHTN 9</title>
<style>
body {{ font-family: system-ui, sans-serif; margin: 16px; background: #f5f6fa; color: #222; line-height: 1.55; }}
.back {{ display: inline-block; margin-bottom: 12px; padding: 8px 14px; background: #fff; border: 1px solid #ccc; border-radius: 6px; color: #1e4a7a; text-decoration: none; font-weight: 600; font-size: 14px; }}
.back:hover {{ background: #e8f1fb; }}
h1 {{ font-size: 20px; margin: 0 0 8px; color: #0b1f3a; }}
.meta {{ color: #555; font-size: 14px; margin-bottom: 16px; }}
.content {{ max-width: 900px; background: #fff; border: 1px solid #d7dce2; border-radius: 10px; padding: 20px 22px; }}
.content p {{ margin: 0 0 10px; }}
.content p.section {{ margin-top: 18px; font-weight: 700; color: #0b1f3a; }}
.content p.question {{ margin-top: 12px; }}
.content p.end {{ text-align: center; margin-top: 24px; color: #64748b; letter-spacing: 0.08em; }}
.content table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; }}
.content th, .content td {{ border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }}
.content table.exam-header td {{ background: #f8fafc; border-color: #cbd5e1; }}
.content table.exam-header p {{ margin: 0 0 4px; }}
.content table.exam-header p:last-child {{ margin-bottom: 0; }}
{INTERACTIVE_CSS}
</style>
</head>
<body>
<a class="back" href="/practice">← Quay lại Đề luyện</a>
<h1>{html.escape(title)}</h1>
<p class="meta">Đề ôn luyện HSG KHTN 9 · chọn đáp án trực tiếp trên đề</p>
<div class="content">
{content}
</div>
</body>
</html>
"""
    info = {
        "num": num,
        "title": title,
        "file": f"de-{num:02d}.html",
        "source": path.name,
        "subject": meta.get("subject") or "",
        "focus": meta.get("focus") or "",
        "duration": meta.get("duration") or "",
    }
    return page, info


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    exams: list[dict] = []
    for path in sorted(SRC.glob("*.docx")):
        page, info = convert_docx(path)
        out_path = OUT / info["file"]
        out_path.write_text(page, encoding="utf-8")
        exams.append(info)
        print(f"wrote {out_path.relative_to(ROOT)} ({info['title']})")

    exams.sort(key=lambda e: e["num"])
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps({"exams": exams}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {MANIFEST.relative_to(ROOT)} ({len(exams)} exams)")


if __name__ == "__main__":
    main()
