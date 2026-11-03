/** 作者页切换：按钮与键盘共用同一状态，禁用动效时保持完整操作。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { aboutMotionAllowed, type AboutMotionOptions } from "../options";
export function initAuthorTabs(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  const buttons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-author-tab]"),
  ];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-author-panel]")];
  if (!buttons.length) return () => {};
  let animation: gsap.core.Tween | undefined;
  const select = (name: string, animate: boolean) => {
    animation?.revert();
    const active = panels.find((panel) => panel.dataset.authorPanel === name);
    buttons.forEach((button) => {
      const chosen = button.dataset.authorTab === name;
      button.setAttribute("aria-selected", String(chosen));
      button.tabIndex = chosen ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel !== active;
    });
    const content = root.querySelector<HTMLElement>("[data-author-content]");
    if (animate && content && content.getBoundingClientRect().top < 85)
      window.scrollTo({
        top: window.scrollY + content.getBoundingClientRect().top - 90,
        behavior: "instant",
      });
    if (active && animate && aboutMotionAllowed(root, options))
      animation = gsap.fromTo(
        active,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45 / options.speed,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform",
        },
      );
    ScrollTrigger.refresh();
  };
  select(root.dataset.authorTab === "activity" ? "activity" : "profile", false);
  const click = (event: MouseEvent) => {
    const button = event.currentTarget as HTMLButtonElement;
    select(button.dataset.authorTab!, true);
  };
  const key = (event: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = buttons.indexOf(event.currentTarget as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next]!.focus();
    select(buttons[next]!.dataset.authorTab!, true);
  };
  buttons.forEach((button) => {
    button.addEventListener("click", click);
    button.addEventListener("keydown", key);
  });
  const anchor = (event: MouseEvent) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;
    if (!link) return;
    const panel = document
      .getElementById(link.hash.slice(1))
      ?.closest<HTMLElement>("[data-author-panel]");
    if (panel?.hidden && root.contains(panel))
      select(panel.dataset.authorPanel!, false);
  };
  root.addEventListener("click", anchor);
  return () => {
    root.removeEventListener("click", anchor);
    animation?.revert();
    buttons.forEach((button) => {
      button.removeEventListener("click", click);
      button.removeEventListener("keydown", key);
    });
    panels.forEach((panel) => {
      panel.hidden = false;
    });
  };
}
