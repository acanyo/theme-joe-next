/**
 * 首页「继续阅读」（pages/index.astro，设置 home.resume_bar）：
 * 访客最近一篇读到一半（10%–90%）的文章，点击进入并回到上次的位置。
 * 数据来自浏览器中的阅读记录（features/visitor.ts），新访客或都读完了时不显示。
 * 点关闭后这篇不再提示，直到读到新的位置（按文章地址 + 最后阅读时间记住）。
 */
import { $ } from "../core/dom";
import { escapeHtml } from "../content/shortcode-parse";
import { iconHtml } from "../core/icons";
import { readHistory } from "./visitor";
import { relativeTime } from "./console-content";

const DISMISS_KEY = "joe-next:resume-dismissed";

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(value: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, value);
  } catch {
    // ignore
  }
}

export function initResumeBar(): void {
  const bar = $<HTMLElement>("[data-joe-resume-bar]");
  if (!bar) return;
  const item = readHistory().find((h) => (h.position ?? h.progress) > 0.1 && (h.position ?? h.progress) < 0.9);
  if (!item) return;
  const stamp = `${item.href}@${item.last}`;
  if (readDismissed() === stamp) return;

  const position = item.position ?? item.progress;
  const pct = Math.round(position * 100);
  bar.innerHTML = `
    <a class="link" href="${escapeHtml(item.href)}" aria-label="${escapeHtml(`继续阅读《${item.title}》，已读 ${pct}%`)}">
      <span class="ring" style="--p: ${pct}" aria-hidden="true"><span>${pct}</span></span>
      <span class="text">
        <span class="label">继续阅读 · ${escapeHtml(relativeTime(new Date(item.last)))}</span>
        <span class="title">${escapeHtml(item.title)}</span>
      </span>
      <span class="go" aria-hidden="true">${iconHtml("chevron-down")}</span>
    </a>
    <button type="button" class="close" aria-label="不再提示这篇" title="不再提示这篇">${iconHtml("close")}</button>`;
  bar.hidden = false;

  // 进入文章后跳到上次的位置（features/visitor.ts 读取）
  $(".link", bar)?.addEventListener("click", () => {
    try {
      sessionStorage.setItem("joe-next:resume", JSON.stringify({ href: item.href, progress: position }));
    } catch {
      // ignore
    }
  });
  $(".close", bar)?.addEventListener("click", () => {
    writeDismissed(stamp);
    bar.classList.add("is-leaving");
    setTimeout(() => (bar.hidden = true), 200);
  });
}
