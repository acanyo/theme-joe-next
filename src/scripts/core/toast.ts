/** 轻量消息提示，替代 Qmsg */
import { $ } from "./dom";

type ToastType = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
  warning: "!",
};

function container(): HTMLElement {
  let el = $("#joe-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "joe-toast";
    el.className = "joe_toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

export function toast(
  message: string,
  type: ToastType = "info",
  duration = 2400,
): void {
  const item = document.createElement("div");
  item.className = `joe_toast__item is-${type}`;
  const icon = document.createElement("span");
  icon.className = "joe_toast__icon";
  icon.textContent = ICONS[type];
  const text = document.createElement("span");
  text.textContent = message;
  item.append(icon, text);
  container().appendChild(item);
  requestAnimationFrame(() => item.classList.add("is-visible"));
  setTimeout(() => {
    item.classList.remove("is-visible");
    item.addEventListener("transitionend", () => item.remove(), { once: true });
  }, duration);
}

export const notify = {
  success: (msg: string) => toast(msg, "success"),
  error: (msg: string) => toast(msg, "error"),
  info: (msg: string) => toast(msg, "info"),
  warning: (msg: string) => toast(msg, "warning"),
};
