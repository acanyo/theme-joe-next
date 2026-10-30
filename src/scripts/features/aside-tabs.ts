/**
 * 侧栏「文章」三合一卡片（components/aside/PostTabsWidget.astro）：点击或左右方向键切换标签，
 * 选择记在本次会话里，换页后保持。
 */
import { $$ } from "../core/dom";

const KEY = "joe-next:aside-tab";

export function initAsideTabs(): void {
  $$<HTMLElement>("[data-joe-aside-tabs]").forEach((box) => {
    const tabs = $$<HTMLButtonElement>("[role=tab]", box);
    const select = (tab: HTMLButtonElement, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls") ?? "");
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      try {
        sessionStorage.setItem(KEY, tab.id);
      } catch {
        // ignore
      }
    };
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(KEY);
    } catch {
      // ignore
    }
    select(tabs.find((t) => t.id === saved) ?? tabs[0]!);
    tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));
    box.addEventListener("keydown", (event) => {
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0 || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
      event.preventDefault();
      select(tabs[(i + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!, true);
    });
  });
}
