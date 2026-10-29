/**
 * 首页「继续阅读」（pages/index.astro，设置 home.resume_bar）：
 * 访客最近一篇读到一半（10%–90%）的文章，点击进入并回到上次的位置。
 * 数据来自浏览器中的阅读记录（features/visitor.ts），新访客或都读完了时不显示。
 */
import { $ } from "../core/dom";
import { escapeHtml } from "../content/shortcode-parse";
import { iconHtml } from "../core/icons";
import { readHistory } from "./visitor";
import { relativeTime } from "./console-content";

export function initResumeBar(): void {
  const bar = $<HTMLAnchorElement>("[data-joe-resume-bar]");
  if (!bar) return;
  const item = readHistory().find((h) => (h.position ?? h.progress) > 0.1 && (h.position ?? h.progress) < 0.9);
  if (!item) return;
  const position = item.position ?? item.progress;
  const pct = Math.round(position * 100);
  bar.href = item.href;
  bar.innerHTML = `
    <span class="ring" style="--p: ${pct}" aria-hidden="true"></span>
    <span class="text"><span class="label">继续阅读</span><span class="title">${escapeHtml(item.title)}</span></span>
    <span class="meta">已读 ${pct}% · ${escapeHtml(relativeTime(new Date(item.last)))}</span>
    ${iconHtml("chevron-down")}`;
  bar.setAttribute("aria-label", `继续阅读《${item.title}》，已读 ${pct}%`);
  bar.hidden = false;
  // 进入文章后跳到上次的位置（features/visitor.ts 读取）
  bar.addEventListener("click", () => {
    try {
      sessionStorage.setItem("joe-next:resume", JSON.stringify({ href: item.href, progress: position }));
    } catch {
      // ignore
    }
  });
}
