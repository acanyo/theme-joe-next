/**
 * axe-core 无障碍检查（WCAG 2 A/AA），明暗两种模式：pnpm qa:a11y
 * 按规则汇总违规项与示例节点；有 serious / critical 级别违规时以非零状态退出。
 * 第三方组件（评论、搜索）不在检查范围内。
 */
import { AxeBuilder } from "@axe-core/playwright";
import { MODES, ROUTES, launch, newContext, open } from "./shared.mjs";

const browser = await launch();
const rules = new Map();
for (const mode of MODES) {
  const ctx = await newContext(browser, { mode, width: 1440 });
  for (const route of ROUTES) {
    const { page } = await open(ctx, route);
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude("halo-comment, [id^=comment-], .halo-search-widget, #vconsole")
      .analyze();
    for (const v of res.violations) {
      const r = rules.get(v.id) ?? { impact: v.impact, help: v.help, pages: new Set(), samples: [] };
      r.pages.add(`${route} (${mode})`);
      for (const n of v.nodes) if (r.samples.length < 4) r.samples.push(`${n.target.join(" ")}  ${n.html.slice(0, 100)}`);
      rules.set(v.id, r);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const sorted = [...rules].sort((a, b) => order[a[1].impact] - order[b[1].impact]);
for (const [id, r] of sorted) {
  console.log(`\n[${r.impact}] ${id}: ${r.help} — ${r.pages.size} page(s)`);
  r.samples.forEach((s) => console.log("   ", s));
}
const blocking = sorted.filter(([, r]) => r.impact === "critical" || r.impact === "serious").length;
console.log(`\n${rules.size} rule(s) violated, ${blocking} serious/critical`);
process.exitCode = blocking ? 1 : 0;
