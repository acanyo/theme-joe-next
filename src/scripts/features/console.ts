/**
 * 中控台（components/navbar/ConsolePanel.astro）：导航按钮打开的全屏玻璃面板。
 *
 * - 面板内容在 <template> 中，首次打开时才放入页面（不影响首屏，图片也不会提前加载）
 * - 打开时锁定页面滚动、焦点移入面板；Esc、再次点击按钮、点击面板外关闭，焦点回到按钮
 * - 快捷开关是访客自己的偏好，保存在浏览器中，页面加载时即生效（applyConsolePrefs）
 */
import { $, $$ } from "../core/dom";
import { toggleColorModeAt, currentMode } from "./color-mode";
import { iconHtml } from "../core/icons";
import { closeOverlays } from "./navigation";
import { refreshConsoleContent, renderConsoleContent } from "./console-content";

const PREFS_KEY = "joe-next:console";

interface Prefs {
  /** 隐藏侧边栏 */
  noAside?: boolean;
  /** 关闭页面动画与过渡 */
  noMotion?: boolean;
}

function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Prefs;
  } catch {
    return {};
  }
}

function writePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 无痕模式等无法写入时，本次会话内仍然生效
  }
}

/** 页面加载与切页后应用访客偏好（作用在 <html> 上，样式见 styles/layout/console.css） */
export function applyConsolePrefs(): void {
  const prefs = readPrefs();
  const root = document.documentElement;
  root.classList.toggle("joe-no-aside", !!prefs.noAside);
  root.classList.toggle("joe-no-motion", !!prefs.noMotion);
}

let panel: HTMLElement | null = null;
let opener: HTMLElement | null = null;

function mount(): HTMLElement | null {
  if (panel) return panel;
  const template = $<HTMLTemplateElement>("#joe-console-template");
  if (!template) return null;
  panel = template.content.firstElementChild?.cloneNode(true) as HTMLElement | null;
  if (!panel) return null;
  document.body.appendChild(panel);
  renderConsoleContent(panel);
  bindSwitches(panel);
  panel.addEventListener("click", (event) => {
    // 点击面板外（遮罩区域）关闭
    if (!(event.target as HTMLElement).closest(".joe_console__panel")) close();
    // 面板中的链接：跳转前关闭，swup 切页时面板不残留
    else if ((event.target as HTMLElement).closest("a[href]")) close(false);
  });
  return panel;
}

function syncSwitches(root: HTMLElement): void {
  const prefs = readPrefs();
  const state: Record<string, boolean> = { aside: !prefs.noAside, motion: !prefs.noMotion };
  $$<HTMLButtonElement>("[data-console-toggle]", root).forEach((button) =>
    button.setAttribute("aria-pressed", String(state[button.dataset.consoleToggle!] ?? true)),
  );
  const mode = $("[data-console-icon='mode']", root);
  if (mode) {
    const dark = currentMode() === "dark";
    mode.innerHTML = iconHtml(dark ? "moon" : "sun");
    mode.parentElement?.setAttribute("aria-pressed", String(dark));
    const label = mode.parentElement?.querySelector(".label");
    if (label) label.textContent = dark ? "暗黑" : "浅色";
  }
}

function bindSwitches(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-console-toggle], [data-console-action]",
    );
    if (!button) return;
    const prefs = readPrefs();
    switch (button.dataset.consoleToggle ?? button.dataset.consoleAction) {
      case "aside":
        prefs.noAside = !prefs.noAside;
        break;
      case "motion":
        prefs.noMotion = !prefs.noMotion;
        break;
      case "mode": {
        const rect = button.getBoundingClientRect();
        // 图标与文字在 joe:color-mode 事件中更新（View Transitions 下模式在回调里才切换）
        toggleColorModeAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return;
      }
      case "top":
        close();
        window.scrollTo({ top: 0, behavior: readPrefs().noMotion ? "instant" : "smooth" });
        return;
      case "search":
        close();
        (window as { SearchWidget?: { open: () => void } }).SearchWidget?.open();
        return;
    }
    writePrefs(prefs);
    applyConsolePrefs();
    syncSwitches(root);
  });
}

function onKeydown(event: KeyboardEvent): void {
  if (!panel?.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  // 焦点留在面板内
  if (event.key !== "Tab") return;
  const focusable = $$<HTMLElement>("a[href], button:not([disabled])", panel).filter(
    (el) => el.offsetParent !== null,
  );
  if (!focusable.length) return;
  const first = focusable[0]!;
  const last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function open(button: HTMLElement): void {
  const root = mount();
  if (!root) return;
  opener = button;
  syncSwitches(root);
  refreshConsoleContent(root);
  root.hidden = false;
  document.documentElement.classList.add("joe-console-open");
  // 下一帧再加 is-open，让进入动画从初始状态开始
  requestAnimationFrame(() => root.classList.add("is-open"));
  button.setAttribute("aria-expanded", "true");
  if (button.classList.contains("joe_header__console")) {
    button.setAttribute("aria-label", "关闭中控台");
    button.innerHTML = iconHtml("close");
  }
  // 焦点放到当前视图的切换按钮上，Tab 依次经过面板内容
  root.querySelector<HTMLElement>("[data-console-switch][aria-selected='true']")?.focus({ preventScroll: true });
}

function close(restoreFocus = true): void {
  if (!panel?.classList.contains("is-open")) return;
  panel.classList.remove("is-open");
  document.documentElement.classList.remove("joe-console-open");
  const done = () => {
    if (!panel?.classList.contains("is-open") && panel) panel.hidden = true;
  };
  panel.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 400);
  if (opener) {
    opener.setAttribute("aria-expanded", "false");
    if (opener.classList.contains("joe_header__console")) {
      opener.setAttribute("aria-label", "打开中控台");
      opener.innerHTML = iconHtml("console");
    }
    if (restoreFocus) opener.focus({ preventScroll: true });
  }
}

/** 外壳初始化（整个会话一次）：按钮在导航中，不随切页替换 */
export function initConsole(): void {
  applyConsolePrefs();
  // 入口：阅读条导航中的按钮（桌面）与侧滑菜单中的按钮（手机）
  const buttons = $$<HTMLElement>("[data-joe-console]");
  if (!buttons.length) return;
  for (const button of buttons)
    button.addEventListener("click", () => {
      if (panel?.classList.contains("is-open")) return close();
      // 从侧滑菜单打开：先收起菜单
      if (button.closest(".joe_header__slideout")) closeOverlays();
      open(button);
    });
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("joe:color-mode", () => panel && syncSwitches(panel));
}

/** 无刷新切页后：关闭面板（面板与模板都在导航中，切页时不会被替换） */
export function refreshConsole(): void {
  close(false);
}
