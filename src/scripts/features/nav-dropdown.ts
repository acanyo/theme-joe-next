/** 桌面导航的子菜单：鼠标悬停、箭头按钮、键盘和焦点离开。 */
import { $, $$ } from "../core/dom";

let closeDropdowns = (): void => {};

export function resetNavDropdowns(): void {
  closeDropdowns();
}

export function initNavDropdowns(): void {
  const closers: (() => void)[] = [];
  for (const dropdown of $$<HTMLElement>(
    ".joe_header__above-nav > .joe_dropdown",
  )) {
    const toggle = $<HTMLButtonElement>(".joe_dropdown__toggle", dropdown);
    const panel = $<HTMLElement>(".joe_dropdown__menu", dropdown);
    if (!toggle || !panel) continue;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    const setOpen = (open: boolean) => {
      clearTimeout(leaveTimer);
      dropdown.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    closers.push(() => setOpen(false));
    dropdown.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      closeDropdowns();
      setOpen(true);
    });
    dropdown.addEventListener("pointerleave", () => {
      leaveTimer = setTimeout(() => {
        if (!panel.contains(document.activeElement)) setOpen(false);
      }, 120);
    });
    toggle.addEventListener("click", () => {
      const open = !dropdown.classList.contains("active");
      closeDropdowns();
      setOpen(open);
    });
    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget as Node | null))
        setOpen(false);
    });
    dropdown.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggle.focus();
      } else if (
        (event.key === "ArrowDown" || event.key === "ArrowUp") &&
        (event.target === toggle ||
          event.target === $(".joe_dropdown__link > a", dropdown))
      ) {
        event.preventDefault();
        closeDropdowns();
        setOpen(true);
        const links = $$<HTMLAnchorElement>(":scope > li > a", panel);
        (event.key === "ArrowDown" ? links[0] : links.at(-1))?.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target as Node)) setOpen(false);
    });
    panel.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a")) setOpen(false);
    });
  }
  closeDropdowns = () => closers.forEach((close) => close());
}
