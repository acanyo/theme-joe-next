/**
 * 明暗模式切换。
 * 首屏模式由 ConfigScript 在 <head> 中同步设置；这里只处理用户手动切换，
 * 并同步 Halo 插件组件约定的 `data-color-scheme`。
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

export function initColorMode(): void {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (getThemeConfig().themeMode !== "user") return;
  syncIcons();
  $$(".joe_action_item.mode").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      applyMode(currentMode() === "dark" ? "light" : "dark");
      syncIcons();
    }),
  );
}
