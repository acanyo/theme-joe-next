/**
 * 自定义右键菜单（设置 effects.context_menu）。
 *
 * 根据右键位置给出不同的操作：
 * - 链接：新窗口打开、复制链接地址
 * - 图片：新窗口打开图片、复制图片地址
 * - 选中文字：复制、站内搜索（需要搜索插件）
 * - 任意位置：后退、刷新、回到顶部、随便看看（设置开启时）、切换明暗（「访客切换」模式时）
 *
 * 以下情况保留浏览器原生菜单：按住 Ctrl / ⌘ / Shift 右键、在输入框 / 可编辑区域内、移动端。
 * 菜单可用方向键 / Enter 操作，Esc、点击外部、滚动或窗口失焦时关闭。
 */
import { isMobile } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { notify } from "../core/toast";
import { currentMode, toggleColorModeAt } from "./color-mode";
import { openRandomPost } from "./random-post";

interface MenuItem {
  label: string;
  icon: string;
  run: () => void;
}

const ICONS = {
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  back: '<path d="M10 6 4 12l6 6M4 12h16"/>',
  reload: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  top: '<path d="M12 20V6M5 11l7-7 7 7M5 4h14"/>',
  mode: '<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/>',
};

const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;

async function copyText(text: string, done: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(done);
  } catch {
    notify.error("复制失败，请手动复制");
  }
}

function buildItems(target: Element, x: number, y: number): MenuItem[][] {
  const groups: MenuItem[][] = [];
  const selection = window.getSelection()?.toString().trim() ?? "";
  if (selection) {
    const items: MenuItem[] = [
      { label: "复制", icon: ICONS.copy, run: () => void copyText(selection, "已复制") },
    ];
    if (document.querySelector("[data-joe-search]"))
      items.push({
        label: `站内搜索「${selection.length > 12 ? selection.slice(0, 12) + "…" : selection}」`,
        icon: ICONS.search,
        run: () => window.SearchWidget?.open(),
      });
    groups.push(items);
  }
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (link && !link.getAttribute("href")!.startsWith("javascript:")) {
    groups.push([
      { label: "新窗口打开", icon: ICONS.open, run: () => window.open(link.href, "_blank", "noopener") },
      { label: "复制链接地址", icon: ICONS.copy, run: () => void copyText(link.href, "链接已复制") },
    ]);
  }
  const img = target.closest("img");
  if (img?.currentSrc || img?.src) {
    const src = img.currentSrc || img.src;
    groups.push([
      { label: "新窗口打开图片", icon: ICONS.image, run: () => window.open(src, "_blank", "noopener") },
      { label: "复制图片地址", icon: ICONS.copy, run: () => void copyText(src, "图片地址已复制") },
    ]);
  }
  const page: MenuItem[] = [
    { label: "后退", icon: ICONS.back, run: () => history.back() },
    { label: "刷新", icon: ICONS.reload, run: () => location.reload() },
  ];
  if (window.scrollY > 200)
    page.push({ label: "回到顶部", icon: ICONS.top, run: () => window.scrollTo({ top: 0, behavior: "smooth" }) });
  if (getThemeConfig().enableRandomPost)
    page.push({ label: "随便看看", icon: ICONS.dice, run: () => void openRandomPost() });
  if (getThemeConfig().themeMode === "user")
    page.push({
      label: currentMode() === "dark" ? "切换到浅色" : "切换到暗黑",
      icon: ICONS.mode,
      run: () => toggleColorModeAt(x, y),
    });
  groups.push(page);
  return groups;
}

export function initContextMenu(): void {
  if (!getThemeConfig().enableContextMenu || isMobile()) return;

  const menu = document.createElement("div");
  menu.className = "joe_context_menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  document.body.appendChild(menu);

  let buttons: HTMLButtonElement[] = [];
  const close = () => {
    if (menu.hidden) return;
    menu.classList.remove("is-open");
    menu.hidden = true;
  };

  const open = (event: MouseEvent) => {
    const target = event.target as Element;
    const groups = buildItems(target, event.clientX, event.clientY);
    menu.replaceChildren();
    buttons = [];
    groups.forEach((items, gi) => {
      if (gi > 0) {
        const sep = document.createElement("div");
        sep.className = "sep";
        sep.setAttribute("role", "separator");
        menu.appendChild(sep);
      }
      for (const item of items) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.innerHTML = `${svg(item.icon)}<span></span>`;
        button.querySelector("span")!.textContent = item.label;
        button.addEventListener("click", () => {
          close();
          item.run();
        });
        menu.appendChild(button);
        buttons.push(button);
      }
    });
    menu.hidden = false;
    // 先放到可测量的位置，再根据视口边界调整，避免溢出屏幕；
    // 展开动画带缩放，用 offsetWidth / offsetHeight 取未缩放的尺寸
    menu.style.left = "0px";
    menu.style.top = "0px";
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const x = Math.min(event.clientX, window.innerWidth - width - 8);
    const y = Math.min(event.clientY, window.innerHeight - height - 8);
    menu.style.left = `${Math.max(8, x)}px`;
    menu.style.top = `${Math.max(8, y)}px`;
    menu.style.transformOrigin = `${event.clientX - x}px ${event.clientY - y}px`;
    requestAnimationFrame(() => menu.classList.add("is-open"));
    buttons[0]?.focus({ preventScroll: true });
  };

  document.addEventListener("contextmenu", (event) => {
    const target = event.target as Element;
    const native =
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], .joe_context_menu");
    if (native) {
      close();
      return;
    }
    event.preventDefault();
    open(event);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target as Node)) close();
  });
  window.addEventListener("scroll", close, { passive: true });
  window.addEventListener("resize", close);
  window.addEventListener("blur", close);

  menu.addEventListener("keydown", (event) => {
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      buttons[event.key === "Home" ? 0 : buttons.length - 1]?.focus();
    }
  });
}
