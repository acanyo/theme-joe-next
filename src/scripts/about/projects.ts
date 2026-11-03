/** 作品分类筛选；禁用动画时仍可操作，离开页面时还原 DOM 和动画。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { aboutMotionAllowed, type AboutMotionOptions } from "./options";
gsap.registerPlugin(Flip);

export function initAboutProjects(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  const filters = root.querySelector<HTMLElement>(
    "[data-about-project-filters]",
  );
  const status = root.querySelector<HTMLElement>("[data-about-project-status]");
  const cards = [
    ...root.querySelectorAll<HTMLElement>("[data-project-category]"),
  ];
  const categories = [
    ...new Set(
      cards
        .map((card) => card.dataset.projectCategory?.trim())
        .filter((category): category is string => !!category),
    ),
  ];
  if (!filters || categories.length < 2) return () => {};

  const animations = gsap.context(() => {}, root);
  const buttons = ["", ...categories].map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.textContent = category || "全部";
    button.setAttribute("aria-pressed", String(category === ""));
    return button;
  });
  filters.replaceChildren(...buttons);
  filters.hidden = false;

  const select = (event: MouseEvent) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-category]")
        : null;
    if (
      !button ||
      !filters.contains(button) ||
      button.getAttribute("aria-pressed") === "true"
    )
      return;
    buttons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    const selected = button.dataset.category;
    Flip.killFlipsOf(cards, true);
    animations.revert();
    gsap.set(cards, { clearProps: "opacity,visibility" });
    const state = Flip.getState(cards);
    cards.forEach((card) => {
      card.hidden =
        !!selected && card.dataset.projectCategory?.trim() !== selected;
    });
    const visible = cards.filter((card) => !card.hidden);
    if (status)
      status.textContent = `${button.textContent}，共 ${visible.length} 个作品`;
    const motion = aboutMotionAllowed(root, options);
    if (motion)
      animations.add(() => {
        Flip.from(state, {
          targets: visible,
          duration: 0.6 / options.speed,
          scale: true,
          absolute: false,
          ease: "power3.inOut",
          stagger: 0.025,
          onEnter: (elements) =>
            gsap.fromTo(
              elements,
              { autoAlpha: 0, scale: 0.8 },
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.4 / options.speed,
                clearProps: "opacity,visibility,transform",
              },
            ),
          onComplete: () => ScrollTrigger.refresh(),
        });
      });
    ScrollTrigger.refresh();
  };
  filters.addEventListener("click", select);

  return () => {
    filters.removeEventListener("click", select);
    animations.revert();
    filters.replaceChildren();
    filters.hidden = true;
    cards.forEach((card) => {
      card.hidden = false;
    });
    if (status) status.textContent = "";
  };
}
