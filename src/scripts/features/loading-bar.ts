/** 顶部加载进度条（替代 NProgress） */
import { getThemeConfig } from "../core/config";

let bar: HTMLElement | undefined;

export function startLoadingBar(): void {
  if (!getThemeConfig().enableLoadingBar) return;
  bar = document.createElement("div");
  bar.className = "joe_loading_bar";
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar?.classList.add("is-loading"));
  // 某个外部资源迟迟不结束时 load 不会触发，最多显示 6 秒
  setTimeout(finishLoadingBar, 6000);
}

export function finishLoadingBar(): void {
  const el = bar;
  if (!el) return;
  bar = undefined;
  el.classList.add("is-done");
  // transitionend 在过渡被跳过（减少动态效果、标签页在后台）时不会触发，兜底定时移除
  const remove = () => el.remove();
  el.addEventListener("transitionend", remove, { once: true });
  setTimeout(remove, 1000);
}
