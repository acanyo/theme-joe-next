/**
 * 视觉 / 无障碍检查的公共配置。需要一个已启用本主题的 Halo 站点（默认 http://127.0.0.1:8091），
 * 以及本机安装的 Chrome（playwright-core 不自带浏览器）。
 *
 *   HALO_URL=http://localhost:8090 pnpm qa:snapshot out/
 */
import { chromium } from "playwright-core";

export const BASE = (process.env.HALO_URL ?? "http://127.0.0.1:8091").replace(/\/$/, "");

/** 覆盖主要模板的路由（不存在的路由会得到 404 页，同样参与比较） */
export const ROUTES = (
  process.env.ROUTES ??
  "/,/archives,/categories,/tags,/moments,/photos,/links,/about,/page/2,/not-found-xyz"
).split(",");

export const MODES = ["light", "dark"];
export const WIDTHS = (process.env.WIDTHS ?? "1440,390").split(",").map(Number);

export const fileOf = (route, mode, width) =>
  `${route === "/" ? "index" : route.slice(1).replace(/\//g, "_")}-${mode}-${width}`;

export function launch() {
  return chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome" });
}

/** 固定颜色模式、减少动态效果、固定随机数，让多次截图可比较 */
export async function newContext(browser, { mode = "light", width = 1440 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: mode,
    reducedMotion: "reduce",
  });
  await ctx.addInitScript((m) => {
    try {
      localStorage.setItem("joe-next:color-mode", m);
    } catch {}
    Math.random = () => 0.5;
  }, mode);
  return ctx;
}

export async function open(ctx, route) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  // 不等 load：一言、不蒜子等外部请求慢时会把 load 拖过超时；DOM 就绪后再等站内资源基本加载完
  const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" }).catch((e) => {
    errors.push(`goto: ${e.message}`);
    return null;
  });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
  return { page, status: res?.status() ?? 0, errors };
}
