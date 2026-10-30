/**
 * 文章页交互：点赞、分享、复制版权、阅读进度、目录、字数统计、评论定位。
 */
import tocbot from "tocbot";
import { readingStats } from "./reading-stats";
import { $, $$, headerOffset } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { copyText } from "../core/clipboard";
import { bindUpvoteButtons } from "../features/upvote";
import { closeOverlays, openTocDrawer } from "../features/navigation";
import { listen, onCleanup } from "../core/lifecycle";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(
    /\{(\w+)\}/g,
    (match, key: string) => vars[key] ?? match,
  );
}

function siteVars(): Record<string, string> {
  const config = getThemeConfig();
  return {
    BlogTitle: config.siteTitle,
    BlogUrl: location.origin,
    postUrl: location.href,
    postTitle: $(".joe_detail__title")?.textContent?.trim() ?? document.title,
    postDescription:
      document.querySelector<HTMLMetaElement>("meta[name=description]")
        ?.content ?? "",
    postAuthor:
      $(".joe_detail__count .author .link")?.textContent?.trim() ?? "",
  };
}

/** 文章 / 页面点赞（正文下方与左侧悬浮栏可能同时存在，计数保持同步） */
export function initLike(): void {
  const detail = $(".joe_detail");
  const buttons = $$("[data-joe-like]");
  if (!detail || !buttons.length) return;
  bindUpvoteButtons(buttons, {
    group: "content.halo.run",
    plural: detail.dataset.kind === "SinglePage" ? "singlepages" : "posts",
    name: detail.dataset.cid ?? "",
  });
}

/**
 * 打赏（正文末尾操作栏）：桌面悬停即显示收款码（纯 CSS）；触屏没有悬停，点按图标切换，
 * 点到别处或按 Esc 收起。
 */
export function initDonate(): void {
  const donate = $(".joe_detail__operate .joe_donate");
  const icon = donate && $(".joe-font", donate);
  if (!donate || !icon) return;
  icon.setAttribute("role", "button");
  icon.setAttribute("tabindex", "0");
  icon.setAttribute("aria-label", "打赏");
  icon.removeAttribute("aria-hidden");
  const toggle = (open = !donate.classList.contains("is-open")) => {
    donate.classList.toggle("is-open", open);
    icon.setAttribute("aria-expanded", String(open));
  };
  icon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });
  icon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });
  listen(document, "click", (event: MouseEvent) => {
    if (!donate.contains(event.target as Node)) toggle(false);
  });
  listen(document, "keydown", (event: KeyboardEvent) => event.key === "Escape" && toggle(false));
}

export function initShare(): void {
  $$("[data-joe-share-link]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const template = link.dataset.template?.trim();
      const vars = {
        ...siteVars(),
        postUrl: link.dataset.url || location.href,
      };
      let text = vars.postUrl;
      if (template) {
        text = fillTemplate(template, vars);
        if (!template.includes("{postUrl}"))
          text += ` ，文章链接: ${vars.postUrl}`;
      }
      void copyText(text, "文章链接已复制");
    }),
  );

}

/** 复制正文时附加版权信息 */
export function initCopyright(): void {
  const article = $(".joe_detail__article");
  const config = getThemeConfig();
  if (
    !article ||
    article.classList.contains("uncopy") ||
    !config.post.copyRightText
  )
    return;
  article.addEventListener("copy", (event) => {
    const selection =
      window
        .getSelection()
        ?.toString()
        .replace(/<已自动折叠>/g, "") ?? "";
    if (!selection || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData(
      "text/plain",
      selection + fillTemplate(config.post.copyRightText, siteVars()),
    );
  });
}

export function initProgressBar(): void {
  const bar = $(".joe_progress_bar");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0}%`;
  };
  update();
  listen(document, "scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
}

/** 字数与阅读时长：沉浸头图与经典信息栏都可能有统计位，全部填写 */
export function initWordCount(): void {
  const targets = $$("[data-joe-word-count]");
  const content = $("#post-inner");
  if (!targets.length || !content) return;
  const clone = content.cloneNode(true) as ParentNode & Node;
  clone.querySelectorAll?.("pre, script, style").forEach((el) => el.remove());
  const { words, minutes } = readingStats(clone.textContent ?? "");
  const label = `${words.toLocaleString("zh-CN")} 字 · 约 ${minutes} 分钟`;
  targets.forEach((target) => {
    target.textContent = label;
    target.setAttribute("title", `${words} 字，预计阅读 ${minutes} 分钟`);
  });
}

/** 侧栏目录在 992px 以下由 CSS 隐藏（styles/pages/post.css），此时改用抽屉中的目录 */
const narrow = (): boolean => window.matchMedia("(max-width: 992px)").matches;

export function initToc(): void {
  const container = $(".toc-container");
  const mobile = narrow();
  if (!container && !mobile) return;
  const tocSelector = mobile ? "#js-toc-mobile" : "#js-toc";
  if (!$(tocSelector)) return;
  const offset = headerOffset();
  onCleanup(() => tocbot.destroy());
  tocbot.init({
    tocSelector,
    contentSelector: ".joe_detail__article",
    headingSelector: "h1, h2, h3, h4, h5, h6",
    ignoreSelector: ".js-toc-ignore",
    collapseDepth: tocDepth(),
    hasInnerContainers: true,
    headingsOffset: offset,
    scrollSmoothOffset: -offset,
    scrollSmooth: true,
    // 不用 tocbot 的「目录固定」：侧栏吸顶由 CSS sticky 完成；而且它在节流后的滚动回调里查找 .toc-container，
    // swup 切到没有目录的页面后回调仍会执行一次，找不到元素就报错
    onClick: () => mobile && closeOverlays(),
  });
  finishToc(tocSelector, mobile);
}

/**
 * 文章没有小标题时：侧栏不留一张「暂无目录」的空卡片，手机上也不显示目录按钮。
 * 有目录时显示手机上的目录按钮。
 */
function finishToc(tocSelector: string, mobile: boolean): void {
  const toc = $(tocSelector);
  const empty = !toc?.querySelector("a");
  if (empty) {
    $(".toc-container")?.setAttribute("hidden", "");
    return;
  }
  showMobileTocButton(mobile);
}

function showMobileTocButton(mobile: boolean): void {
  if (!mobile) return;
  const button = $(".joe_action .toc");
  if (!button) return;
  button.style.display = "flex";
  button.addEventListener("click", () => openTocDrawer());
}

/** 目录展开层级（设置 post.toc_depth） */
function tocDepth(): number {
  return getThemeConfig().post.tocDepth;
}

/** Halo 文章标题未设置 id 时补齐，保证目录锚点可用 */
export function ensureHeadingIds(): void {
  $$<HTMLElement>(".joe_detail__article :is(h1,h2,h3,h4,h5,h6)").forEach(
    (heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
    },
  );
}

export function scrollToHash(): void {
  const hash = decodeURIComponent(location.hash);
  if (!hash) return;
  const target = document.getElementById(hash.slice(1));
  if (target)
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - headerOffset(),
    });
}
