/**
 * 无刷新切页（swup）。仅在主题设置「页面切换方式」为 swup 时启用。
 *
 * - 只替换 #swup 容器；导航、页脚常驻，切页后由 refresh 回调同步状态。
 * - <head> 由 @swup/head-plugin 同步：标题、meta、页面专属样式（等待新样式加载完再显示，避免闪烁）。
 * - 容器内的内联脚本（评论组件、广告、自定义 HTML）在替换后重新执行；主题自身脚本不会重复执行。
 * - 切页前执行 lifecycle 清理，切页后重新运行页面脚本。
 * - 后台、登录、下载、外链、新窗口、带 data-no-swup 的链接走普通跳转。
 */
import Swup from "swup";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupPreloadPlugin from "@swup/preload-plugin";
import SwupScrollPlugin from "@swup/scroll-plugin";
import SwupProgressPlugin from "@swup/progress-plugin";
import SwupA11yPlugin from "@swup/a11y-plugin";
import { headerOffset } from "./dom";
import { runCleanups } from "./lifecycle";

/** 这些路径由 Halo 后台或插件处理，必须整页加载 */
const FULL_RELOAD_PATHS =
  /^\/(console|uc|login|logout|signup|apis|actuator|upload|plugins|themes\/[^/]+\/assets)(\/|$)|\.(xml|txt|json|zip|pdf)$/i;

export interface SwupOptions {
  preload: boolean;
  /** 每次进入新页面（含首次加载后的每次切页）时调用 */
  onPageView: () => void | Promise<void>;
}

function shouldIgnore(url: string, el?: Element): boolean {
  if (el?.closest("[data-no-swup]")) return true;
  const link = el?.closest("a");
  if (link && (link.target === "_blank" || link.hasAttribute("download")))
    return true;
  try {
    return FULL_RELOAD_PATHS.test(new URL(url, location.origin).pathname);
  } catch {
    return true;
  }
}

/** 重新执行容器内由模板或插件输出的内联/外部脚本（不含主题打包脚本） */
function rerunContainerScripts(container: Element): void {
  container
    .querySelectorAll<HTMLScriptElement>(
      "script:not([data-swup-ignore-script])",
    )
    .forEach((old) => {
      const script = document.createElement("script");
      for (const { name, value } of Array.from(old.attributes))
        script.setAttribute(name, value);
      script.textContent = old.textContent;
      old.replaceWith(script);
    });
}

/** Halo 访问量统计：halo-tracker.js 只在首次加载时上报，切页后按新页面的 data-* 手动上报 */
function trackView(doc: Document): void {
  const tracker = doc.querySelector<HTMLScriptElement>(
    "script[src*='halo-tracker.js']",
  );
  if (!tracker) return;
  const { group, plural, name } = tracker.dataset;
  if (!plural || !name) return;
  void fetch("/apis/api.halo.run/v1alpha1/trackers/counter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group: group ?? "",
      plural,
      name,
      hostname: location.hostname,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      url: location.pathname + location.search,
      referrer: document.referrer,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function initSwup({
  preload,
  onPageView,
}: SwupOptions): Swup | undefined {
  const container = document.getElementById("swup");
  if (!container) return undefined;

  const swup = new Swup({
    containers: ["#swup"],
    animationSelector: ".joe_swup",
    cache: true,
    ignoreVisit: (url, { el } = {}) => shouldIgnore(url, el),
    plugins: [
      new SwupHeadPlugin({ awaitAssets: true, timeout: 3000 }),
      new SwupScrollPlugin({
        animateScroll: {
          betweenPages: false,
          samePageWithHash: true,
          samePage: true,
        },
        offset: () => headerOffset(),
        // 插件默认实现每次滚动都会登记 scrollend / wheel 监听（once），
        // 但「瞬间滚动」或已在目标位置时 scrollend 不会触发，监听会随切页不断累积。
        // 这里只在平滑滚动时等待 scrollend，瞬间滚动直接结束。
        scrollFunction: (el, top, left, animate, start, end) => {
          start();
          if (!animate) {
            el.scrollTo({ top, left, behavior: "instant" });
            end();
            return;
          }
          const target =
            el instanceof HTMLHtmlElement || el instanceof HTMLBodyElement
              ? window
              : el;
          const cancel = () =>
            el.scrollTo({
              top: el.scrollTop,
              left: el.scrollLeft,
              behavior: "instant",
            });
          const done = () => {
            target.removeEventListener("wheel", cancel);
            end();
          };
          target.addEventListener("scrollend", done, { once: true });
          target.addEventListener("wheel", cancel, { once: true });
          el.scrollTo({ top, left, behavior: "smooth" });
        },
      }),
      new SwupProgressPlugin({ delay: 300, className: "swup-progress-bar" }),
      new SwupA11yPlugin(),
      ...(preload
        ? [new SwupPreloadPlugin({ preloadVisibleLinks: false })]
        : []),
    ],
  });

  // 切页前：释放当前页面的事件、定时器与实例
  swup.hooks.on("visit:start", () => runCleanups());

  // 内容替换后：登录态、评论数等可能变化，不复用旧缓存
  swup.hooks.on("content:replace", (visit, { page }) => {
    rerunContainerScripts(document.getElementById("swup") ?? container);
    trackView(new DOMParser().parseFromString(page.html, "text/html"));
    swup.cache.delete(visit.to.url);
  });

  swup.hooks.on("page:view", () => void onPageView());

  return swup;
}
