/**
 * 计算样式快照：记录每个页面所有元素（含 ::before/::after）的计算样式，用于重构 CSS 前后对比。
 *
 *   pnpm qa:snapshot .qa/before      # 修改前
 *   pnpm qa:snapshot .qa/after       # 修改后
 *   pnpm qa:diff .qa/before .qa/after [.qa/noise]
 *
 * 第三个参数可选：对同一版本再拍一次得到的快照，两次之间本就不同的属性（访问量、一言等实时内容）会被忽略。
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { MODES, ROUTES, WIDTHS, fileOf, launch, newContext, open } from "./shared.mjs";

/** 不参与比较的元素：第三方组件、实时内容 */
const SKIP_TAGS = /^(SCRIPT|STYLE|LINK|META|NOSCRIPT|CANVAS|IFRAME|HALO-COMMENT|TEMPLATE)$/;
const SKIP_WITHIN = "halo-comment, .swiper-wrapper, #vconsole, .tags-cloud";

async function snapshot(outDir) {
  mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  for (const mode of MODES)
    for (const width of WIDTHS) {
      const ctx = await newContext(browser, { mode, width });
      for (const route of ROUTES) {
        const { page } = await open(ctx, route);
        const snap = await page.evaluate(
          async ({ skipTags, skipWithin }) => {
            await document.fonts.ready;
            document.getAnimations().forEach((a) => {
              a.pause();
              a.currentTime = 0;
            });
            const skipProp = /^(transition|animation|will-change|caret|cursor)/;
            const tagRe = new RegExp(skipTags);
            const out = [];
            const walk = (el, path) => {
              for (const pseudo of [null, "::before", "::after"]) {
                const cs = getComputedStyle(el, pseudo);
                if (pseudo && (cs.content === "none" || cs.content === "normal")) continue;
                const s = {};
                for (let i = 0; i < cs.length; i++) {
                  const p = cs[i];
                  if (!skipProp.test(p)) s[p] = cs.getPropertyValue(p);
                }
                out.push({ k: path + (pseudo ?? ""), s });
              }
              [...el.children].forEach((c, i) => {
                if (!tagRe.test(c.tagName) && !c.closest(skipWithin))
                  walk(c, `${path}>${c.tagName.toLowerCase()}${c.id ? "#" + c.id : ""}:${i}`);
              });
            };
            walk(document.documentElement, "html");
            return out;
          },
          { skipTags: SKIP_TAGS.source, skipWithin: SKIP_WITHIN },
        );
        writeFileSync(`${outDir}/${fileOf(route, mode, width)}.json`, JSON.stringify(snap));
        await page.close();
      }
      await ctx.close();
    }
  await browser.close();
  console.log("snapshot written to", outDir);
}

/** 尺寸、位置类属性随内容变化，单独统计，避免淹没真正的样式差异 */
const GEOMETRY = /^(width|height|inline-size|block-size|top|right|bottom|left|inset-.*|transform-origin|perspective-origin)$/;

function diff(a, b, noise) {
  let total = 0;
  for (const f of readdirSync(a).filter((x) => x.endsWith(".json"))) {
    const A = JSON.parse(readFileSync(`${a}/${f}`, "utf8"));
    const B = JSON.parse(readFileSync(`${b}/${f}`, "utf8"));
    const N = noise ? JSON.parse(readFileSync(`${noise}/${f}`, "utf8")) : null;
    const lines = [];
    let geometry = 0;
    if (A.length !== B.length) lines.push(`element count ${A.length} -> ${B.length}`);
    for (let i = 0; i < Math.min(A.length, B.length); i++) {
      if (A[i].k !== B[i].k) {
        lines.push(`structure differs at #${i}: ${A[i].k} -> ${B[i].k}`);
        break;
      }
      for (const p in A[i].s) {
        if (A[i].s[p] === B[i].s[p] || (N?.[i] && N[i].s[p] !== A[i].s[p])) continue;
        if (GEOMETRY.test(p)) geometry++;
        else lines.push(`${A[i].k} ${p}: ${A[i].s[p]} -> ${B[i].s[p]}`);
      }
    }
    total += lines.length;
    if (lines.length || geometry)
      console.log(`== ${f}: ${lines.length} style, ${geometry} geometry\n${lines.slice(0, 40).join("\n")}`);
  }
  console.log("style diffs:", total);
  process.exitCode = total ? 1 : 0;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "--diff") diff(...args);
else if (cmd) await snapshot(cmd);
else console.log("usage: snapshot.mjs OUT_DIR | --diff A B [NOISE]");
