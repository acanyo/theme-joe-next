/** 悬浮操作按钮：返回顶部、友链随机跳转 */
import { $, $$, throttle } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { notify } from "../core/toast";

function initBackToTop(): void {
  const button = $(".joe_action_item.back2top");
  if (!button || !getThemeConfig().enableBack2top) return;
  const update = () => button.classList.toggle("active", window.scrollY > 300);
  update();
  document.addEventListener("scroll", throttle(update, 120), { passive: true });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    window.scrollTo({
      top: 0,
      behavior: getThemeConfig().enableBack2topSmooth ? "smooth" : "auto",
    });
  });
}

function initRandomLink(): void {
  const button = $(".joe_action_item.random");
  if (!button) return;
  button.addEventListener("click", () => {
    const items = $$<HTMLAnchorElement>(".joe_detail__friends-item a[href]");
    if (!items.length) return;
    const target = items[
      Math.floor(Math.random() * items.length)
    ] as HTMLAnchorElement;
    const name =
      target.querySelector(".sub-text")?.textContent?.trim() || target.href;
    notify.success(`即将跳转到：「${name}」`);
    setTimeout(() => window.open(target.href, "_blank", "noopener"), 2000);
  });
}

export function initActions(): void {
  initBackToTop();
  initRandomLink();
}
