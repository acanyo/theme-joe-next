/**
 * 键盘快捷键（设置 effects.shortcuts）：整个会话只绑定一次（外壳），按当前页面上有什么来决定能不能用。
 *
 *   j / k   下一篇 / 上一篇（文章页底部的上一篇 / 下一篇卡片）
 *   t       回到顶部
 *   /       搜索（需要搜索插件；⌘K / Ctrl K 由导航自己处理）
 *   r       随便看看（设置开启时）
 *   d       切换明暗（「访客切换」模式时）
 *   ?       显示 / 关闭这份说明
 *
 * 在输入框、可编辑区域里，或按着 Ctrl / ⌘ / Alt 时不响应，不和浏览器、输入法冲突。
 * 跳转用页面上已有的链接的 click()，开启 swup 时一样走无刷新切页。
 */
import { $ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { iconHtml } from "../core/icons";
import { openRandomPost } from "./random-post";
import { toggleColorModeAt } from "./color-mode";

interface Shortcut {
  keys: string[];
  label: string;
  /** 当前页面能否使用 */
  available: () => boolean;
  run: () => void;
}

const click = (selector: string) => () => $<HTMLElement>(selector)?.click();

const SHORTCUTS: Shortcut[] = [
  {
    keys: ["j"],
    label: "下一篇（更早的一篇）",
    available: () => !!$("a.joe_post__pagination-item.next"),
    run: click("a.joe_post__pagination-item.next"),
  },
  {
    keys: ["k"],
    label: "上一篇（更新的一篇）",
    available: () => !!$("a.joe_post__pagination-item.prev"),
    run: click("a.joe_post__pagination-item.prev"),
  },
  {
    keys: ["t"],
    label: "回到顶部",
    available: () => true,
    run: () => window.scrollTo({ top: 0, behavior: "smooth" }),
  },
  {
    keys: ["/"],
    label: "搜索（也可以按 ⌘K / Ctrl K）",
    available: () => !!window.SearchWidget && !!$("[data-joe-search]"),
    run: () => window.SearchWidget?.open(),
  },
  {
    keys: ["r"],
    label: "随便看看",
    available: () => getThemeConfig().enableRandomPost,
    run: () => void openRandomPost(),
  },
  {
    keys: ["d"],
    label: "切换明暗",
    available: () => getThemeConfig().themeMode === "user",
    run: () => toggleColorModeAt(window.innerWidth - 40, 40),
  },
];

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!el.closest("[contenteditable='true']");
}

let dialog: HTMLDialogElement | null = null;

function renderHelp(): HTMLDialogElement {
  const d = document.createElement("dialog");
  d.className = "joe_shortcuts";
  d.setAttribute("aria-labelledby", "joe-shortcuts-title");
  d.innerHTML = `
    <div class="head">
      <h2 id="joe-shortcuts-title">键盘快捷键</h2>
      <button type="button" class="close" aria-label="关闭">${iconHtml("close")}</button>
    </div>
    <ul></ul>
    <p class="foot">按 <kbd>?</kbd> 打开或关闭；在输入框里不生效</p>`;
  d.querySelector(".close")!.addEventListener("click", () => d.close());
  d.addEventListener("click", (event) => event.target === d && d.close());
  document.body.appendChild(d);
  return d;
}

function toggleHelp(): void {
  dialog ??= renderHelp();
  if (dialog.open) {
    dialog.close();
    return;
  }
  // 每次打开按当前页面重新列出：文章页才有上一篇 / 下一篇
  const rows: [string[], string][] = SHORTCUTS.filter((s) => s.available()).map((s) => [s.keys, s.label]);
  rows.push([["?"], "显示这份说明"]);
  dialog.querySelector("ul")!.innerHTML = rows
    .map(([keys, label]) => `<li><span>${label}</span><span class="keys">${keys.map((k) => `<kbd>${k}</kbd>`).join("")}</span></li>`)
    .join("");
  dialog.showModal();
}

export function initShortcuts(): void {
  if (!getThemeConfig().enableShortcuts) return;
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target)) return;
    if (event.key === "?") {
      event.preventDefault();
      toggleHelp();
      return;
    }
    // 帮助打开时其他快捷键不响应（Esc 由 <dialog> 自己关闭）
    if (dialog?.open) return;
    // 页面上还有别的弹窗（海报、申请友链等）开着时也不响应
    if (document.querySelector("dialog[open]")) return;
    // swup 正在切页（<html> 上有 is-changing）：页面上还是旧内容，连按会点到旧页面的链接、打断过渡动画
    if (document.documentElement.classList.contains("is-changing")) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const shortcut = SHORTCUTS.find((s) => s.keys.includes(key));
    if (!shortcut || !shortcut.available()) return;
    event.preventDefault();
    shortcut.run();
  });
}
