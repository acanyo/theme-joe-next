/**
 * 全页截图并收集控制台错误：pnpm qa:shots [OUT_DIR]（默认 .qa/shots）。
 * 任一页面出现 4xx/5xx 状态码或脚本错误时以非零状态退出。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { MODES, ROUTES, WIDTHS, fileOf, launch, newContext, open } from "./shared.mjs";

const outDir = process.argv[2] ?? ".qa/shots";
mkdirSync(outDir, { recursive: true });
const browser = await launch();
const report = {};
let failed = 0;
for (const mode of MODES)
  for (const width of WIDTHS) {
    const ctx = await newContext(browser, { mode, width });
    for (const route of ROUTES) {
      const { page, status, errors } = await open(ctx, route);
      const name = fileOf(route, mode, width);
      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
      const expected = route === "/not-found-xyz" ? 404 : 200;
      const pageErrors = errors.filter((e) => !e.startsWith("console: Failed to load resource"));
      if (status !== expected || pageErrors.length) failed++;
      report[name] = { status, errors };
      console.log(`${status === expected ? "ok " : "BAD"} ${status} ${name}${pageErrors.length ? "  " + pageErrors[0] : ""}`);
      await page.close();
    }
    await ctx.close();
  }
await browser.close();
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(`${failed} page(s) with problems; screenshots in ${outDir}`);
process.exitCode = failed ? 1 : 0;
