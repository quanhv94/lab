import { readFile, stat } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const HTML_ROOT = path.join(process.cwd(), "src/html");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

function resolveSafe(segments: string[]) {
  const joined = path.normalize(segments.join("/"));
  if (joined.startsWith("..") || path.isAbsolute(joined)) return null;
  const filePath = path.resolve(HTML_ROOT, joined);
  if (!filePath.startsWith(HTML_ROOT + path.sep) && filePath !== HTML_ROOT) {
    return null;
  }
  return filePath;
}

/** Base URL with trailing slash so relative ../css/js resolve under /html/. */
function baseHrefFor(segments: string[], servedAsDirectoryIndex: boolean) {
  if (!segments.length) return "/html/";
  const last = segments[segments.length - 1] ?? "";
  const looksLikeFile = last.includes(".") && !servedAsDirectoryIndex;
  const dir = looksLikeFile ? segments.slice(0, -1) : segments;
  return dir.length ? `/html/${dir.join("/")}/` : "/html/";
}

function injectIntoHead(html: string, snippet: string) {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${snippet}`);
  }
  return `<!DOCTYPE html><head>${snippet}</head>${html}`;
}

function injectBaseTag(html: string, baseHref: string) {
  if (/<base\s/i.test(html)) return html;
  return injectIntoHead(html, `<base href="${baseHref}">`);
}

/** Hide back button + page title when embedded in the app iframe (?embed=1). */
function injectEmbedChromeHide(html: string) {
  const style = `<style id="qh-embed-hide">
.back,
body > a.back,
body > h1,
body > .meta,
.sim-btn,
.sim-wrap,
.explorer > .titlebar,
.explorer > .toolbar,
.explorer > .statusbar { display: none !important; }
html, body { margin: 0 !important; height: 100% !important; overflow: auto !important; }
body { padding: 8px !important; box-sizing: border-box !important; }
body:has(.content) {
  background: #fff !important;
  font-size: 20px !important;
  padding: 20px 24px !important;
}
.layout { display: block !important; }
.content {
  max-width: none !important;
  width: auto !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 20px !important;
}
.content p { font-size: 20px !important; line-height: 1.65 !important; }
.content table { font-size: 18px !important; }
body:has(.wrap) { background: #fff !important; padding: 16px 18px !important; }
.wrap { align-items: stretch !important; }
canvas, .panel {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.panel label, .panel button, .result, .note { font-size: 18px !important; }
.explorer { margin: 0 !important; box-shadow: none !important; }
</style>`;
  return injectIntoHead(html, style);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments = [] } = await context.params;
  let filePath = resolveSafe(segments);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    let servedAsDirectoryIndex = false;
    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      info = await stat(filePath);
      servedAsDirectoryIndex = true;
      if (!info.isFile()) {
        return new Response("Not found", { status: 404 });
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const body = await readFile(filePath);
    const embed = request.nextUrl.searchParams.get("embed") === "1";

    if (ext === ".html" || ext === ".htm") {
      let html = injectBaseTag(
        body.toString("utf8"),
        baseHrefFor(segments, servedAsDirectoryIndex),
      );
      if (embed) {
        html = injectEmbedChromeHide(html);
      }
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": MIME[ext],
          "Cache-Control": "no-cache",
        },
      });
    }

    const noCache =
      ext === ".js" || ext === ".mjs" || ext === ".css" || ext === ".map";
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": noCache ? "no-cache" : "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
