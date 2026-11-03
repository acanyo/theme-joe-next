/** 文章收藏按钮与控制中心的收藏列表，共用本地存储和页面生命周期。 */
import { $$ } from "../core/dom";
import { escapeHtml } from "../core/html";
import { listen } from "../core/lifecycle";
import { relativeTime } from "../core/time";
import { toast } from "../core/toast";
import {
  BOOKMARKS_KEY,
  readBookmarks,
  removeBookmark,
  toggleBookmark,
} from "./bookmarks-store";

function refreshButtons(): void {
  const saved = new Set(readBookmarks().map((item) => item.id));
  $$<HTMLButtonElement>("[data-joe-bookmark]").forEach((button) => {
    const active = saved.has(button.dataset.bookmarkId || "");
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      active ? "取消收藏文章" : "收藏文章，稍后阅读",
    );
    button.title = active ? "已收藏，点击取消" : "收藏，稍后阅读";
    const label = button.querySelector("[data-bookmark-label]");
    if (label) label.textContent = active ? "已收藏" : "收藏";
  });
}

/** 面板每次打开时更新，收藏列表不会混入浏览记录。 */
export function renderBookmarks(root: ParentNode = document): void {
  const items = readBookmarks();
  root
    .querySelectorAll<HTMLElement>("[data-console-bookmarks]")
    .forEach((list) => {
      list.innerHTML = items
        .map(
          (item) => `<li>
      <a href="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}"><span class="text">${escapeHtml(item.title)}</span><time datetime="${new Date(item.savedAt).toISOString()}">${relativeTime(new Date(item.savedAt))}</time></a>
      <button type="button" data-remove-bookmark="${escapeHtml(item.id)}" aria-label="取消收藏《${escapeHtml(item.title)}》" title="取消收藏">×</button>
    </li>`,
        )
        .join("");
    });
  root
    .querySelectorAll<HTMLElement>("[data-console-bookmarks-empty]")
    .forEach((el) => {
      el.hidden = items.length > 0;
    });
  root.querySelectorAll<HTMLElement>("[data-bookmarks-count]").forEach((el) => {
    el.textContent = items.length ? `（${items.length}）` : "";
  });
}

function refresh(): void {
  refreshButtons();
  renderBookmarks();
}

export function initBookmarks(): void {
  refresh();
  listen(document, "click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(
      "[data-joe-bookmark]",
    );
    if (button) {
      const result = toggleBookmark({
        id: button.dataset.bookmarkId || "",
        href: button.dataset.bookmarkHref || "",
        title: button.dataset.bookmarkTitle || "",
      });
      if (!result.ok) {
        toast(
          result.reason === "limit"
            ? "已收藏 200 篇文章，请先取消部分收藏"
            : "收藏保存失败，请检查浏览器存储设置",
          "error",
        );
        return;
      }
      refresh();
      toast(
        result.saved ? "已收藏，可在控制中心「我的足迹」查看" : "已取消收藏",
        "success",
      );
      return;
    }
    const remove = event.target.closest<HTMLButtonElement>(
      "[data-remove-bookmark]",
    );
    if (remove) {
      if (!removeBookmark(remove.dataset.removeBookmark || "")) {
        toast("取消收藏失败，请检查浏览器存储设置", "error");
        return;
      }
      const heading = remove
        .closest("[data-console-view]")
        ?.querySelector<HTMLElement>("[data-bookmarks-heading]");
      refresh();
      heading?.focus({ preventScroll: true });
      toast("已取消收藏", "success");
    }
  });
  listen(window, "storage", (event) => {
    if (event.key === BOOKMARKS_KEY || event.key === null) refresh();
  });
}
