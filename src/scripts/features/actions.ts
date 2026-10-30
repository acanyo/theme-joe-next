/** 悬浮操作按钮：返回顶部、友链随机跳转 */
import { $, $$, throttle } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { notify } from "../core/toast";
import { listen } from "../core/lifecycle";

function initBackToTop(): void {
  const button = $(".joe_action_item.back2top");
  if (!button || !getThemeConfig().enableBack2top) return;
  const update = () => button.classList.toggle("active", window.scrollY > 300);
  update();
  listen(document, "scroll", throttle(update, 120), { passive: true });
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

/**
 * 页脚进入视口时，悬浮按钮跟着上移，始终停在页脚上方 12px，不压住页脚文字。
 * 窄屏页脚居中排列，按钮正好落在文字上；宽屏页脚右侧已留出位置，同样处理以保持一致。
 */
function initFooterAvoid(): void {
  const actions = $<HTMLElement>(".joe_action");
  const footer = $<HTMLElement>(".joe_footer");
  if (!actions || !footer) return;
  const update = () => {
    const bottom = parseFloat(getComputedStyle(actions).bottom) || 0;
    const lift = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top - bottom + 12);
    actions.style.setProperty("--action-lift", `${Math.round(lift)}px`);
  };
  update();
  listen(window, "scroll", update, { passive: true });
  listen(window, "resize", throttle(update, 150));
}

export function initActions(): void {
  initBackToTop();
  initRandomLink();
  initFooterAvoid();
}
