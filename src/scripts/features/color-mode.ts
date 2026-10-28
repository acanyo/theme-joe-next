/**
 * 明暗模式切换。
 * 首屏模式由 ConfigScript 在 <head> 中同步设置；这里只处理用户手动切换，
 * 并同步 Halo 插件组件约定的 `data-color-scheme`。
 *
 * 切换按钮有两处：右下角悬浮按钮（.joe_action_item.mode）与阅读条导航中的按钮（.joe_header__mode）。
 * 支持 View Transitions 时，新模式从被点击的按钮处以圆形扩散展开。
 */
import { $$ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import type { ColorMode } from "../../config/theme-config";

const STORAGE_KEY = "data-mode";

export function currentMode(): ColorMode {
  return document.documentElement.getAttribute("data-mode") === "dark"
    ? "dark"
    : "light";
}

function applyMode(mode: ColorMode): void {
  const root = document.documentElement;
  root.setAttribute("data-mode", mode);
  root.setAttribute("data-color-scheme", mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  document.dispatchEvent(new CustomEvent("joe:color-mode", { detail: mode }));
}

function syncIcons(): void {
  const dark = currentMode() === "dark";
  $$(".joe_action_item.mode .mode-light").forEach((el) =>
    el.classList.toggle("active", !dark),
  );
  $$(".joe_action_item.mode .mode-dark").forEach((el) =>
    el.classList.toggle("active", dark),
  );
}

/** 以 (x, y) 为圆心，圆形扩散切换到新模式；不支持或开启「减少动态效果」时直接切换 */
export function toggleColorModeAt(x: number, y: number): void {
  const next: ColorMode = currentMode() === "dark" ? "light" : "dark";
  const apply = () => {
    applyMode(next);
    syncIcons();
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    apply();
    return;
  }
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const root = document.documentElement;
  root.classList.add("is-mode-switching");
  const transition = document.startViewTransition(apply);
  void transition.ready.then(() => {
    root.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
  void transition.finished.finally(() =>
    root.classList.remove("is-mode-switching"),
  );
}

function toggleFrom(button: HTMLElement): void {
  const box = button.getBoundingClientRect();
  toggleColorModeAt(box.left + box.width / 2, box.top + box.height / 2);
}

export function initColorMode(): void {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (getThemeConfig().themeMode !== "user") return;
  syncIcons();
  $$<HTMLElement>(".joe_action_item.mode, .joe_header__mode").forEach(
    (button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFrom(button);
      }),
  );
}
