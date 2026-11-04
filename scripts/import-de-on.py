#!/usr/bin/env python3
"""Convert de_on/*.docx + answer key → graded practice HTML."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "de_on"
ANSWER_DOC = ROOT / "data" / "dap_an_de_on" / "ĐÁP ÁN ĐỀ ÔN HSG - WEB.docx"
OUT = ROOT / "frontend" / "src" / "html" / "de-on"
MANIFEST = ROOT / "frontend" / "src" / "data" / "de-on-manifest.json"
ANSWERS_JSON = ROOT / "frontend" / "src" / "data" / "de-on-answers.json"

CUT_RE = re.compile(r"HƯỚNG\s+DẪN\s+CHẤM", re.IGNORECASE)
ANSWER_SHEET_HINT = re.compile(r"điền\s+đáp\s+án\s+vào\s+bảng", re.I)
EXAM_START_RE = re.compile(
    r"(?:^ĐỀ\s*(\d+)\.?$)|(?:ĐỀ\s*ÔN\s*LUYỆN\s*SỐ\s*(\d+))",
    re.I,
)
ESSAY_CAU_RE = re.compile(r"^Câu\s+([IVX]+)\b", re.I)


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def plain_el(el: ET.Element) -> str:
    return "".join(t.text or "" for t in el.iter(W + "t")).strip()


def parse_points(raw: str) -> float:
    s = raw.strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def ensure_fill_brackets(text: str) -> str:
    """If a scored line has no tokens, wrap the value after '=' as [answer]."""
    if "[" in text or "{" in text:
        return text
    m = re.search(r"=\s*([0-9]+(?:[.,][0-9]+)?)", text)
    if not m:
        return text
    return text[: m.start(1)] + f"[{m.group(1)}]" + text[m.end(1) :]


def parse_brace_group(inner: str, trailing_answer: str | None) -> tuple[list[str], str | None]:
    options: list[str] = []
    answer = trailing_answer.strip() if trailing_answer else None
    for part in inner.split("/"):
        part = part.strip()
        m = re.fullmatch(r"\[([^\]]+)\]", part)
        if m:
            options.append(m.group(1).strip())
            answer = m.group(1).strip()
        elif part:
            options.append(part)
    return options, answer


def tokenize_essay_line(text: str, points: float) -> dict:
    """Parse fill-ins and radio groups from an answer-key content line."""
    text = ensure_fill_brackets(text)
    segments: list[dict] = []
    fields: list[dict] = []
    pos = 0
    # Match either {[a]/b} or {a/b} optionally followed by [answer], or plain [fill]
    token_re = re.compile(
        r"\{([^{}]+)\}(?:\s*\[([^\]]+)\])?"  # radio group
        r"|\[([^\[\]]+)\]"  # fill-in
    )
    for m in token_re.finditer(text):
        if m.start() > pos:
            segments.append({"type": "text", "text": text[pos : m.start()]})
        if m.group(1) is not None:
            options, answer = parse_brace_group(m.group(1), m.group(2))
            if options and answer:
                fid = f"f{len(fields)}"
                fields.append({"id": fid, "kind": "radio", "answer": answer, "options": options})
                segments.append({"type": "radio", "fieldId": fid, "options": options})
            else:
                segments.append({"type": "text", "text": m.group(0)})
        else:
            answer = (m.group(3) or "").strip()
            fid = f"f{len(fields)}"
            fields.append({"id": fid, "kind": "fill", "answer": answer})
            segments.append({"type": "fill", "fieldId": fid})
        pos = m.end()
    if pos < len(text):
        segments.append({"type": "text", "text": text[pos:]})

    if fields:
        each = round(points / len(fields), 4)
        for f in fields:
            f["points"] = each
    return {"text": text, "points": points, "segments": segments, "fields": fields}


def parse_answer_doc(path: Path) -> dict[int, dict]:
    with ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    assert body is not None

    exams: dict[int, dict] = {}
    current: dict | None = None
    section = "none"  # mcq | tf | short | essay
    essay_cau: str | None = None

    def ensure_exam(num: int) -> dict:
        nonlocal current
        exam = exams.setdefault(
            num,
            {
                "num": num,
                "mcq": {},  # "1" -> "C"
                "tf": {},  # "1-a" -> "Đúng"
                "short": {},  # "1" -> "6"
                "shortPoints": 0.5,
                "mcqPoints": 0.25,
                "tfPoints": 0.25,
                "essay": {},  # "I" -> [rows]
                "hasEssayKey": False,
            },
        )
        current = exam
        return exam

    for child in list(body):
        tag = local(child.tag)
        if tag == "p":
            text = plain_el(child)
            if not text:
                continue
            m = EXAM_START_RE.search(text)
            if m and (m.group(1) or m.group(2)):
                num = int(m.group(1) or m.group(2))
                ensure_exam(num)
                section = "none"
                essay_cau = None
                continue
            if current is None:
                continue
            if re.search(r"Nhiều phương án lựa chọn", text, re.I):
                section = "mcq"
                pm = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*điểm", text)
                if pm:
                    current["mcqPoints"] = parse_points(pm.group(1))
                continue
            if re.search(r"Đúng\s*[–-]\s*Sai|Đúng\s*Sai", text, re.I):
                section = "tf"
                pm = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*điểm", text)
                if pm:
                    current["tfPoints"] = parse_points(pm.group(1))
                continue
            if re.search(r"Trả lời ngắn", text, re.I):
                section = "short"
                pm = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*điểm", text)
                if pm:
                    current["shortPoints"] = parse_points(pm.group(1))
                continue
            if re.search(r"PHẦN\s*B|TỰ\s*LUẬN", text, re.I):
                section = "essay"
                continue
            em = ESSAY_CAU_RE.match(text)
            if em and section == "essay":
                essay_cau = em.group(1).upper()
                current["essay"].setdefault(essay_cau, [])
                current["hasEssayKey"] = True
                continue
            continue

        if tag != "tbl" or current is None:
            continue

        rows = child.findall(W + "tr")
        if not rows:
            continue
        grid = [[plain_el(tc) for tc in tr.findall(W + "tc")] for tr in rows]

        if section == "mcq" and len(grid) >= 2:
            # row0 labels, row1 answers
            labels = grid[0][1:]
            answers = grid[1][1:]
            for lab, ans in zip(labels, answers):
                if lab.isdigit() and ans:
                    current["mcq"][lab] = ans.strip().upper()
            continue

        if section == "tf" and len(grid) >= 3:
            # find ý row and đáp án row
            y_row = next((r for r in grid if r and r[0].lower().startswith("ý")), None)
            a_row = next((r for r in grid if r and r[0].lower().startswith("đáp")), None)
            header = grid[0]
            if y_row and a_row:
                # Map each ý to câu 1 or 2 by column groups from header
                # header: Câu | Câu 1 | Câu 2  (Câu 1/2 may span)
                # ý: Ý | a b c d | a b c d
                # answers align with ý columns
                y_vals = y_row[1:]
                a_vals = a_row[1:]
                # Determine câu boundaries from header cells after first
                cau_labels: list[str] = []
                # Expand header: often only two cells "Câu 1","Câu 2" but ý has 8 cols
                # Use half/half if 8 answers
                if len(a_vals) == 8:
                    for i, (y, a) in enumerate(zip(y_vals, a_vals)):
                        q = "1" if i < 4 else "2"
                        key = f"{q}-{y.strip().lower()}"
                        current["tf"][key] = a.strip()
                else:
                    for y, a in zip(y_vals, a_vals):
                        if y and a:
                            current["tf"][y.strip().lower()] = a.strip()
            continue

        if section == "short" and len(grid) >= 2:
            labels = grid[0][1:]
            answers = grid[1][1:]
            for lab, ans in zip(labels, answers):
                if lab.isdigit() and ans:
                    current["short"][lab] = ans.strip()
            continue

        if section == "essay" and essay_cau and grid and grid[0] and grid[0][0].lower().startswith("nội"):
            for row in grid[1:]:
                if len(row) < 2:
                    continue
                content, pts_raw = row[0], row[1]
                if not content.strip():
                    continue
                points = parse_points(pts_raw)
                item = tokenize_essay_line(content.strip(), points)
                if item["fields"]:
                    current["essay"][essay_cau].append(item)
                    current["hasEssayKey"] = True
            continue

    return exams


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
    return "".join(t.text or "" for t in p.iter(W + "t")).strip()


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
            paras = [x for x in (para_to_html(p) for p in tc.findall(W + "p")) if x]
            cells.append(f"<td>{''.join(paras) if paras else '&nbsp;'}</td>")
        rows_html.append("<tr>" + "".join(cells) + "</tr>")
    css = ' class="exam-header"' if header_style else ""
    return f"<table{css}>" + "".join(rows_html) + "</table>"


def extract_meta(body_kids: list[ET.Element]) -> dict[str, str]:
    meta = {"title_line": "", "subject": "", "focus": "", "duration": ""}
    if not body_kids or local(body_kids[0].tag) != "tbl":
        return meta
    tr = body_kids[0].find(W + "tr")
    if tr is None:
        return meta
    tcs = tr.findall(W + "tc")
    right = []
    if len(tcs) >= 2:
        right = [para_text_plain(p) for p in tcs[1].findall(W + "p") if para_text_plain(p)]
    for line in right:
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
        opts.append((parts[i], re.sub(r"(\t| {2,})+$", "", parts[i + 1].strip(" \t"))))
        i += 2
    return opts if len(opts) >= 2 else None


def parse_single_abcd(inner: str) -> tuple[str, str] | None:
    m = re.match(r"<strong>([A-D])\.</strong>\s*(.*)$", inner, flags=re.S)
    return (m.group(1), m.group(2).strip()) if m else None


def parse_tf_item(inner: str) -> tuple[str, str] | None:
    m = re.match(r"<strong>([a-d])\)</strong>\s*(.*)$", inner, flags=re.S)
    return (m.group(1), m.group(2).strip()) if m else None


def render_mcq_options(name: str, opts: list[tuple[str, str]], answer: str | None, points: float) -> str:
    items = []
    ans_attr = f' data-answer="{html.escape(answer)}" data-points="{points}"' if answer else ""
    for letter, text in opts:
        oid = f"{name}-{letter}"
        items.append(
            f'<label class="option" for="{html.escape(oid)}">'
            f'<input type="radio" name="{html.escape(name)}" id="{html.escape(oid)}" value="{html.escape(letter)}" />'
            f'<span class="opt-key">{html.escape(letter)}.</span>'
            f'<span class="opt-text">{text}</span>'
            f"</label>"
        )
    return f'<div class="options grade-item" data-kind="mcq" data-name="{html.escape(name)}"{ans_attr} role="radiogroup">' + "".join(items) + "</div>"


def render_tf_item(name: str, letter: str, text: str, answer: str | None, points: float) -> str:
    yes_id = f"{name}-dung"
    no_id = f"{name}-sai"
    ans_attr = f' data-answer="{html.escape(answer)}" data-points="{points}"' if answer else ""
    return (
        f'<div class="tf-item grade-item" data-kind="tf" data-name="{html.escape(name)}"{ans_attr}>'
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


def render_short_input(qnum: str, answer: str | None, points: float) -> str:
    ans_attr = f' data-answer="{html.escape(answer)}" data-points="{points}"' if answer else ""
    return (
        f'<div class="short-wrap grade-item" data-kind="short" data-name="short-{html.escape(qnum)}"{ans_attr}>'
        f'<label class="short-label">Đáp án Câu {html.escape(qnum)}: '
        f'<input type="text" class="short-input" name="short-{html.escape(qnum)}" autocomplete="off" /></label>'
        f"</div>"
    )


def render_essay_field(exam_num: int, cau: str, row_idx: int, field: dict, prefix_html: str = "") -> str:
    name = f"essay-{exam_num}-{cau}-{row_idx}-{field['id']}"
    pts = field["points"]
    ans = field["answer"]
    if field["kind"] == "fill":
        return (
            f'<span class="grade-item inline-field" data-kind="fill" data-name="{html.escape(name)}" '
            f'data-answer="{html.escape(ans)}" data-points="{pts}">'
            f'{prefix_html}<input type="text" class="fill-input" name="{html.escape(name)}" autocomplete="off" />'
            f"</span>"
        )
    # radio
    opts_html = []
    for opt in field["options"]:
        oid = f"{name}-{abs(hash(opt)) % 10_000_000}"
        opts_html.append(
            f'<label class="essay-radio" for="{html.escape(oid)}">'
            f'<input type="radio" name="{html.escape(name)}" id="{html.escape(oid)}" value="{html.escape(opt)}" />'
            f"<span>{html.escape(opt)}</span></label>"
        )
    return (
        f'<span class="grade-item inline-field radio-field" data-kind="essay-radio" data-name="{html.escape(name)}" '
        f'data-answer="{html.escape(ans)}" data-points="{pts}">'
        f'{prefix_html}<span class="essay-radios">{"".join(opts_html)}</span></span>'
    )


def render_essay_row(exam_num: int, cau: str, row_idx: int, row: dict) -> str:
    parts: list[str] = []
    field_map = {f["id"]: f for f in row["fields"]}
    for seg in row["segments"]:
        if seg["type"] == "text":
            parts.append(html.escape(seg["text"]))
        elif seg["type"] == "fill":
            parts.append(render_essay_field(exam_num, cau, row_idx, field_map[seg["fieldId"]]))
        elif seg["type"] == "radio":
            parts.append(render_essay_field(exam_num, cau, row_idx, field_map[seg["fieldId"]]))
    return f'<div class="essay-row">{"".join(parts)}</div>'


def render_essay_panel(exam_num: int, cau: str, rows: list[dict] | None, *, textarea_fallback: bool) -> str:
    if rows:
        body = "".join(render_essay_row(exam_num, cau, i, row) for i, row in enumerate(rows))
        return (
            f'<div class="answer-panel" data-cau="{html.escape(cau)}">'
            f'<p class="answer-panel-title">Phiếu trả lời — Câu {html.escape(cau)}</p>'
            f"{body}</div>"
        )
    if textarea_fallback:
        name = f"essay-free-{exam_num}-{cau}"
        return (
            f'<div class="answer-panel" data-cau="{html.escape(cau)}">'
            f'<p class="answer-panel-title">Trả lời Câu {html.escape(cau)} (không chấm tự động)</p>'
            f'<textarea class="essay-textarea" name="{html.escape(name)}" rows="5" '
            f'placeholder="Nhập bài làm của em..."></textarea></div>'
        )
    return ""


GRADE_JS = r"""
(function () {
  var locked = false;
  function norm(v) {
    return String(v == null ? "" : v)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/,/g, ".");
  }
  function selectedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function setFieldValue(name, kind, value) {
    if (kind === "mcq" || kind === "tf" || kind === "essay-radio") {
      var radios = document.querySelectorAll('input[type=radio][name="' + name + '"]');
      radios.forEach(function (inp) {
        inp.checked = norm(inp.value) === norm(value);
      });
      return;
    }
    var input = document.querySelector('input[type=text][name="' + name + '"]');
    if (input) input.value = value == null ? "" : String(value);
  }
  function highlightCorrectChoice(item, answer) {
    var inputs = item.querySelectorAll("input[type=radio]");
    inputs.forEach(function (inp) {
      var lab = inp.closest("label");
      if (!lab) return;
      lab.classList.remove("is-key");
      if (norm(inp.value) === norm(answer)) lab.classList.add("is-key");
    });
  }
  function markItem(item, ok) {
    item.classList.remove("is-correct", "is-wrong");
    item.classList.add(ok ? "is-correct" : "is-wrong");
    var old = item.querySelector(".grade-feedback");
    if (old) old.remove();
    var ans = item.getAttribute("data-answer") || "";
    var kind = item.getAttribute("data-kind");
    if (kind === "mcq" || kind === "tf" || kind === "essay-radio") {
      highlightCorrectChoice(item, ans);
    }
    var fb = document.createElement("span");
    fb.className = "grade-feedback";
    if (ok) {
      fb.textContent = "Đúng";
    } else {
      fb.innerHTML = 'Sai — đáp án: <strong class="correct-ans"></strong>';
      fb.querySelector(".correct-ans").textContent = ans;
    }
    item.appendChild(fb);
  }
  function lockInputs() {
    document.querySelectorAll(".grade-item input, .essay-textarea").forEach(function (inp) {
      inp.disabled = true;
    });
    var btn = document.getElementById("submit-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Đã nộp bài";
    }
  }
  function showScore(earned, total, note) {
    var box = document.getElementById("score-box");
    if (!box) return;
    box.hidden = false;
    box.innerHTML =
      "<strong>Điểm: " +
      Number(earned).toFixed(2).replace(".", ",") +
      " / " +
      Number(total).toFixed(2).replace(".", ",") +
      "</strong>" +
      '<span class="score-note"> ' +
      (note || "(đúng: xanh · sai: đỏ, kèm đáp án đúng)") +
      "</span>";
  }
  function restoreResult(payload) {
    if (!payload || !payload.items) return;
    locked = true;
    payload.items.forEach(function (row) {
      setFieldValue(row.name, row.kind, row.userAnswer);
      var item = document.querySelector('.grade-item[data-name="' + row.name + '"]');
      if (item) markItem(item, !!row.correct);
    });
    lockInputs();
    showScore(payload.score, payload.maxScore, "(xem lại bài đã nộp — không làm lại)");
  }
  function grade() {
    if (locked) return;
    var total = 0;
    var earned = 0;
    var details = [];
    var items = document.querySelectorAll(".grade-item[data-answer]");
    items.forEach(function (item) {
      var pts = parseFloat(item.getAttribute("data-points") || "0") || 0;
      total += pts;
      var kind = item.getAttribute("data-kind");
      var name = item.getAttribute("data-name");
      var answer = item.getAttribute("data-answer") || "";
      var user = "";
      if (kind === "mcq" || kind === "tf" || kind === "essay-radio") {
        user = selectedValue(name);
      } else {
        var input = item.querySelector("input[type=text]");
        user = input ? input.value : "";
      }
      var ok = norm(user) !== "" && norm(user) === norm(answer);
      var got = ok ? pts : 0;
      if (ok) earned += pts;
      details.push({
        name: name || "",
        kind: kind || "",
        userAnswer: user,
        correctAnswer: answer,
        correct: ok,
        points: pts,
        earned: got,
      });
      markItem(item, ok);
    });
    locked = true;
    lockInputs();
    showScore(earned, total, "(đúng: xanh · sai: đỏ, kèm đáp án đúng)");
    try {
      var examNum = parseInt(document.body.getAttribute("data-exam-num") || "0", 10);
      var examTitle = document.body.getAttribute("data-exam-title") || ("Đề số " + examNum);
      window.parent.postMessage(
        {
          type: "practice-result",
          payload: {
            examNum: examNum,
            examTitle: examTitle,
            score: Math.round(earned * 100) / 100,
            maxScore: Math.round(total * 100) / 100,
            items: details,
          },
        },
        window.location.origin
      );
    } catch (e) {}
  }
  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var data = event.data;
    if (!data || data.type !== "practice-restore") return;
    restoreResult(data.payload);
  });
  try {
    window.parent.postMessage({ type: "practice-ready" }, window.location.origin);
  } catch (e) {}
  var btn = document.getElementById("submit-btn");
  if (btn) btn.addEventListener("click", grade);
})();
"""

INTERACTIVE_CSS = """
.options {
  display: flex; flex-direction: column; gap: 8px; margin: 8px 0 16px;
  padding: 10px; border: 1px solid transparent; border-radius: 12px;
}
.option {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; background: #fff; transition: border-color .15s, background .15s;
}
.option:hover { border-color: #93c5fd; background: #f8fbff; }
.option:has(input:checked) { border-color: #3b82f6; background: #eff6ff; }
.option.is-key, .tf-choice.is-key, .essay-radio.is-key {
  border-color: #16a34a !important; background: #f0fdf4 !important; color: #15803d;
}
.option input { margin: 0; accent-color: #2563eb; flex-shrink: 0; }
.opt-key { font-weight: 700; color: #0b1f3a; min-width: 1.4em; line-height: 1.4; }
.opt-text { flex: 1; line-height: 1.4; }
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
.short-wrap { margin: 8px 0 16px; }
.short-label { font-weight: 600; display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.short-input, .fill-input {
  min-width: 7rem; max-width: 14rem; padding: 6px 10px;
  border: 1px solid #cbd5e1; border-radius: 8px; font: inherit;
}
.fill-input { min-width: 4.5rem; margin: 0 4px; }
.answer-panel {
  margin: 12px 0 22px; padding: 14px 16px; border: 1px dashed #94a3b8;
  border-radius: 12px; background: #f8fafc;
}
.answer-panel-title { margin: 0 0 10px; font-weight: 700; color: #0b1f3a; }
.essay-row { margin: 0 0 10px; line-height: 1.7; }
.essay-textarea {
  width: 100%; box-sizing: border-box; padding: 10px 12px;
  border: 1px solid #cbd5e1; border-radius: 10px; font: inherit; resize: vertical;
}
.essay-radios { display: inline-flex; flex-wrap: wrap; gap: 6px; vertical-align: middle; margin: 0 4px; }
.essay-radio {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 999px;
  background: #fff; cursor: pointer; font-weight: 600; font-size: 14px;
}
.essay-radio:has(input:checked) { border-color: #3b82f6; background: #eff6ff; }
.inline-field { display: inline; }
.grade-item.is-correct, .grade-item.is-correct.option, .tf-item.is-correct, .short-wrap.is-correct, .inline-field.is-correct {
  border-color: #16a34a !important; background: #f0fdf4 !important;
}
.grade-item.is-wrong, .grade-item.is-wrong.option, .tf-item.is-wrong, .short-wrap.is-wrong, .inline-field.is-wrong {
  border-color: #dc2626 !important; background: #fef2f2 !important;
}
.inline-field.is-correct .fill-input,
.inline-field.is-wrong .fill-input { border-color: inherit; }
.grade-feedback { display: inline-block; margin-left: 8px; font-size: 13px; font-weight: 600; }
.is-correct > .grade-feedback, .is-correct .grade-feedback { color: #15803d; }
.is-wrong > .grade-feedback, .is-wrong .grade-feedback { color: #b91c1c; }
.correct-ans { color: #15803d; }
.submit-bar {
  position: sticky; bottom: 0; margin-top: 20px; padding: 14px 0 4px;
  background: linear-gradient(to top, #fff 70%, transparent); display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
}
#submit-btn {
  appearance: none; border: 0; border-radius: 10px; padding: 12px 18px;
  background: #1e4a7a; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer;
}
#submit-btn:hover { background: #163a63; }
#submit-btn:disabled { opacity: .7; cursor: default; }
#score-box { font-size: 16px; color: #0b1f3a; }
.score-note { color: #64748b; font-size: 13px; font-weight: 500; margin-left: 6px; }
"""


def enhance_interactive(blocks: list[str], answers: dict | None, exam_num: int) -> str:
    answers = answers or {}
    mcq_ans = answers.get("mcq") or {}
    tf_ans = answers.get("tf") or {}
    short_ans = answers.get("short") or {}
    essay_ans = answers.get("essay") or {}
    has_essay_key = bool(answers.get("hasEssayKey"))
    mcq_pts = float(answers.get("mcqPoints") or 0.25)
    tf_pts = float(answers.get("tfPoints") or 0.25)
    short_pts = float(answers.get("shortPoints") or 0.5)

    out: list[str] = []
    mode = "none"
    skip_next_table = False
    mcq_q: str | None = None
    mcq_opts: list[tuple[str, str]] = []
    current_qnum: str | None = None
    current_essay: str | None = None
    essay_buffer: list[str] = []

    def flush_mcq() -> None:
        nonlocal mcq_q, mcq_opts
        if mcq_q is None:
            return
        out.append(mcq_q)
        if mcq_opts and current_qnum is not None:
            out.append(
                render_mcq_options(
                    f"mcq-{current_qnum}",
                    mcq_opts,
                    mcq_ans.get(current_qnum),
                    mcq_pts,
                )
            )
        mcq_q = None
        mcq_opts = []

    def flush_essay() -> None:
        nonlocal current_essay, essay_buffer
        if current_essay is None:
            return
        out.extend(essay_buffer)
        rows = essay_ans.get(current_essay) if has_essay_key else None
        panel = render_essay_panel(
            exam_num,
            current_essay,
            rows,
            textarea_fallback=not has_essay_key,
        )
        if panel:
            out.append(panel)
        current_essay = None
        essay_buffer = []

    for block in blocks:
        plain = strip_tags(block).strip()

        if ANSWER_SHEET_HINT.search(plain):
            skip_next_table = True
            continue
        if block.startswith("<table") and "exam-header" not in block and skip_next_table:
            skip_next_table = False
            continue

        if 'class="section"' in block:
            flush_mcq()
            flush_essay()
            if re.search(r"nhiều phương án lựa chọn", plain, re.I):
                mode = "mcq"
            elif re.search(r"đúng sai", plain, re.I):
                mode = "tf"
            elif re.search(r"trả lời ngắn", plain, re.I):
                mode = "short"
            elif re.search(r"PHẦN B", plain, re.I):
                mode = "essay"
            else:
                mode = "other"
            out.append(block)
            continue

        if 'class="end"' in block:
            flush_mcq()
            flush_essay()
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
                key = f"{current_qnum}-{letter}"
                out.append(
                    render_tf_item(
                        f"tf-{current_qnum}-{letter}",
                        letter,
                        text,
                        tf_ans.get(key),
                        tf_pts,
                    )
                )
                continue
            out.append(block)
            continue

        if mode == "short" and inner is not None:
            flush_mcq()
            q = re.match(r"<strong>Câu\s+(\d+)\.</strong>", inner)
            if q:
                current_qnum = q.group(1)
                out.append(block)
                out.append(
                    render_short_input(
                        current_qnum,
                        short_ans.get(current_qnum),
                        short_pts,
                    )
                )
                continue
            out.append(block)
            continue

        if mode == "essay":
            flush_mcq()
            q = re.match(r"<strong>Câu\s+([IVX]+)\.", inner or "")
            if q:
                flush_essay()
                current_essay = q.group(1).upper()
                essay_buffer = [block]
                continue
            if current_essay is not None:
                essay_buffer.append(block)
                continue
            out.append(block)
            continue

        flush_mcq()
        flush_essay()
        out.append(block)

    flush_mcq()
    flush_essay()

    out.append(
        '<div class="submit-bar">'
        '<button type="button" id="submit-btn">Nộp bài &amp; chấm điểm</button>'
        '<div id="score-box" hidden></div>'
        "</div>"
    )
    return "\n".join(out)


def convert_docx(path: Path, answers: dict | None) -> tuple[str, dict]:
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
    content = enhance_interactive(parts, answers, num)
    has_essay = bool(answers and answers.get("hasEssayKey"))
    note = (
        "Chọn/trả lời rồi bấm Nộp bài để chấm điểm"
        if has_essay
        else "Chấm tự động phần trắc nghiệm; tự luận dùng ô viết bài (không chấm tự động)"
    )
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
<body data-exam-num="{num}" data-exam-title="{html.escape(title)}">
<a class="back" href="/practice">← Quay lại Đề luyện</a>
<h1>{html.escape(title)}</h1>
<p class="meta">{html.escape(note)}</p>
<div class="content">
{content}
</div>
<script>
{GRADE_JS}
</script>
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
        "hasEssayKey": has_essay,
    }
    return page, info


def main() -> None:
    if not ANSWER_DOC.exists():
        raise SystemExit(f"Missing answer key: {ANSWER_DOC}")
    answer_map = parse_answer_doc(ANSWER_DOC)
    ANSWERS_JSON.parent.mkdir(parents=True, exist_ok=True)
    # JSON-serialize without non-serializable leftovers
    serializable = {str(k): v for k, v in sorted(answer_map.items())}
    ANSWERS_JSON.write_text(
        json.dumps(serializable, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {ANSWERS_JSON.relative_to(ROOT)} ({len(answer_map)} exams)")

    OUT.mkdir(parents=True, exist_ok=True)
    exams: list[dict] = []
    for path in sorted(SRC.glob("*.docx")):
        num_m = re.search(r"so_(\d+)", path.stem, re.I)
        num = int(num_m.group(1)) if num_m else 0
        page, info = convert_docx(path, answer_map.get(num))
        out_path = OUT / info["file"]
        out_path.write_text(page, encoding="utf-8")
        exams.append(info)
        essay = "essay-key" if info["hasEssayKey"] else "textarea-only"
        print(f"wrote {out_path.relative_to(ROOT)} ({info['title']}, {essay})")

    exams.sort(key=lambda e: e["num"])
    MANIFEST.write_text(
        json.dumps({"exams": exams}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
