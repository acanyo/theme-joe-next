import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { SEO_PAGES } from "../src/config/seo.ts";

/** 每个页面模板在 BaseLayout 上声明的 seo 类型 */
function declaredSeo(): Map<string, string | null> {
  const out = new Map<string, string | null>();
  const files = [...readdirSync("src/pages"), ...readdirSync("src/pages/error").map((f) => `error/${f}`)];
  for (const file of files) {
    // layout.astro 是插件页面借用的外壳，head 由插件提供
    if (!file.endsWith(".astro") || file === "layout.astro") continue;
    const src = readFileSync(`src/pages/${file}`, "utf8");
    out.set(file, /<BaseLayout\b[^>]*\bseo="([^"]+)"/s.exec(src)?.[1] ?? null);
  }
  return out;
}

describe("SEO module", () => {
  it("every theme page declares a known SEO page type", () => {
    for (const [file, type] of declaredSeo()) {
      assert.ok(type, `${file} 没有在 BaseLayout 上声明 seo="…"`);
      assert.ok(type === "none" || type in SEO_PAGES, `${file} 的 seo="${type}" 不在 config/seo.ts 里`);
    }
  });

  it("paged lists say how to read their page number", () => {
    for (const type of ["home", "category", "tag", "author", "archives", "moments"] as const)
      assert.ok(SEO_PAGES[type].page, `${type} 是分页列表，需要 page 表达式`);
  });

  it("settings.yaml has a switch for each output", () => {
    const yaml = readFileSync("settings.yaml", "utf8");
    for (const name of ["metadata", "structured_data", "feed_discovery", "ai_crawl"])
      assert.match(yaml, new RegExp(`- group: seo[\\s\\S]*?name: ${name}\\n`), `缺少 seo.${name}`);
  });
});
