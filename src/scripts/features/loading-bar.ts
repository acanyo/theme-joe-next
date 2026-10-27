/** 顶部加载进度条（替代 NProgress） */
import { getThemeConfig } from "../core/config";

let bar: HTMLElement | undefined;

export function startLoadingBar(): void {
  if (!getThemeConfig().enableLoadingBar) return;
  bar = document.createElement("div");
  bar.className = "joe_loading_bar";
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar?.classList.add("is-loading"));
}

export function finishLoadingBar(): void {
  if (!bar) return;
  bar.classList.add("is-done");
  bar.addEventListener("transitionend", () => bar?.remove(), { once: true });
}
