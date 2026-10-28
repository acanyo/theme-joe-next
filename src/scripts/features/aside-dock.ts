/**
 * 窄屏侧栏面板：右下角按钮打开 / 关闭，Esc、点击遮罩或切页时关闭。
 * 宽屏下侧栏是普通的吸顶列，按钮由 CSS 隐藏，这里的状态不影响布局。
 */
import { $ } from "../core/dom";
import { listen, onCleanup } from "../core/lifecycle";

export function initAsideDock(): void {
  const toggle = $<HTMLButtonElement>(".joe_aside_toggle");
  const aside = $<HTMLElement>("#joe-aside");
  if (!toggle || !aside) return;
  const root = document.documentElement;

  const setOpen = (open: boolean) => {
    root.classList.toggle("aside-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭侧栏" : "打开侧栏");
  };

  listen(toggle, "click", () =>
    setOpen(!root.classList.contains("aside-open")),
  );
  listen(document, "keydown", (event) => {
    if ((event as KeyboardEvent).key === "Escape") setOpen(false);
  });
  listen(document, "click", (event) => {
    if (!root.classList.contains("aside-open")) return;
    const target = event.target as Node;
    if (!aside.contains(target) && !toggle.contains(target)) setOpen(false);
  });
  onCleanup(() => setOpen(false));
}
