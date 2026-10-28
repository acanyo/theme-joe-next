/**
 * 文章页交互：点赞、分享、复制版权、阅读进度、目录、字数统计、评论定位。
 */
import tocbot from "tocbot";
import { buildRawToc, renderRawContent } from "./raw-content";
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

  // 微信二维码：悬停或键盘聚焦时才生成
  $$("[data-joe-share-weixin]").forEach((weixin) => {
    const qrcode = $(".qrcode_wx", weixin);
    if (!qrcode) return;
    let rendered = false;
    const render = async () => {
      if (rendered) return;
      rendered = true;
      const { toCanvas } = await import("qrcode");
      const canvas = document.createElement("canvas");
      await toCanvas(canvas, weixin.dataset.url || location.href, {
        width: 140,
        margin: 1,
      });
      canvas.setAttribute("aria-label", "文章链接二维码");
      qrcode.replaceChildren(canvas);
    };
    weixin.addEventListener("mouseenter", () => void render());
    weixin.addEventListener("focus", () => void render());
  });
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
  const root = renderRawContent() ?? content;
  const clone = root.cloneNode(true) as ParentNode & Node;
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
  const raw = renderRawContent();
  if (raw) {
    buildRawToc(raw, $(tocSelector)!, { offset, onNavigate: () => mobile && closeOverlays() });
    showMobileTocButton(mobile);
    return;
  }
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
    positionFixedSelector: ".toc-container",
    positionFixedClass: "is-position-fixed",
    fixedSidebarOffset: "auto",
    onClick: () => mobile && closeOverlays(),
  });
  if (!$(tocSelector)?.children.length) {
    $(tocSelector)!.innerHTML = '<div class="toc-nodata">暂无目录</div>';
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

/** 目录展开层级：文章元数据 toc_depth 优先，其次主题设置 */
function tocDepth(): number {
  const own = Number.parseInt($(".joe_detail")?.dataset.tocDepth ?? "", 10);
  return Number.isFinite(own) ? own : getThemeConfig().post.tocDepth;
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

/** 文章系列：「展开全部」按钮 */
export function initSeries(): void {
  const button = $<HTMLButtonElement>("[data-joe-series-more]");
  const list = $(".joe_series__list");
  if (!button || !list) return;
  if (!list.querySelector(".is-far")) {
    button.remove();
    return;
  }
  button.addEventListener("click", () => {
    list.classList.add("is-expanded");
    button.remove();
  });
}
