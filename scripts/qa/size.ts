/**
 * 首屏资源体积预算：pnpm build:templates 之后运行（pnpm qa:size）。
 *
 * 首屏 = 每个页面模板直接引用的 CSS / JS（按需加载的 chunk 不计），按 gzip 后大小计算；
 * 主题包 = dist/ 下 pnpm build 生成的 zip（存在时检查）。超出预算时以非零状态退出，CI 中用于防止体积回退。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const TEMPLATES = "templates";
const ASSETS = join(TEMPLATES, "assets");

/** gzip 后的上限（KB） */
export const BUDGET = { css: 48, js: 40, package: 6 * 1024 };

const DIST = "dist";

const gz = (file: string) => gzipSync(readFileSync(file)).length;
const kb = (n: number) => Math.round((n / 1024) * 10) / 10;

/** 模板直接引用的资源（<link rel=stylesheet>、<script type=module src>） */
export function firstScreenAssets(html: string): { css: string[]; js: string[] } {
  const ref = (re: RegExp) =>
    [...html.matchAll(re)].map((m) => m[1]!.split("/").pop()!).filter((f) => !f.includes("?"));
  return {
    css: ref(/<link[^>]+rel="stylesheet"[^>]+href="[^"]*\/assets\/([^"]+\.css)"/g),
    js: ref(/<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"]+\.js)"/g),
  };
}

/** JS 入口静态 import 的 chunk 也在首屏加载 */
function withStaticImports(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  const src = readFileSync(join(ASSETS, entry), "utf8");
  // 静态导入：import"./x.js"、import{a}from"./x.js"（不含动态 import("./x.js")）
  for (const m of src.matchAll(/\bimport\s*(?:[\w${},*\s]+?from\s*)?["']\.\/([^"']+\.js)["']/g))
    withStaticImports(m[1]!, seen);
  return seen;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = false;
  const rows: string[] = [];
  for (const name of readdirSync(TEMPLATES).filter((f) => f.endsWith(".html"))) {
    const { css, js } = firstScreenAssets(readFileSync(join(TEMPLATES, name), "utf8"));
    const jsAll = new Set<string>();
    js.forEach((e) => withStaticImports(e, jsAll));
    const cssSize = css.reduce((s, f) => s + gz(join(ASSETS, f)), 0);
    const jsSize = [...jsAll].reduce((s, f) => s + gz(join(ASSETS, f)), 0);
    const over = kb(cssSize) > BUDGET.css || kb(jsSize) > BUDGET.js;
    failed ||= over;
    rows.push(`${over ? "OVER" : "ok  "} ${name.padEnd(22)} css ${String(kb(cssSize)).padStart(5)}KB  js ${String(kb(jsSize)).padStart(5)}KB`);
  }
  console.log(rows.join("\n"));
  const zip = existsSync(DIST) && readdirSync(DIST, { withFileTypes: true }).find((f) => f.name.endsWith(".zip"));
  if (zip) {
    const pkg = kb(statSync(join(DIST, zip.name)).size);
    const pkgOver = pkg > BUDGET.package;
    failed ||= pkgOver;
    console.log(`${pkgOver ? "OVER" : "ok  "} package ${zip.name} ${pkg}KB`);
  }
  console.log(`budget (gzip): css ${BUDGET.css}KB, js ${BUDGET.js}KB per page; package ${BUDGET.package}KB`);
  process.exitCode = failed ? 1 : 0;
}
