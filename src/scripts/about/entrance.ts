/** 首屏拆字与模块入场；语义标题保留完整名称，离开页面时还原文字。 */
import { gsap } from "gsap";
import type { AboutMotionOptions } from "./options";
export function prepareAboutHeadline(root: HTMLElement): () => void {
  const title = root.querySelector<HTMLElement>("[data-about-headline]");
  if (!title) return () => {};
  const text = title.textContent || "";
  const previousLabel = title.getAttribute("aria-label");
  const fragment = document.createDocumentFragment();
  Array.from(text).forEach((char) => {
    if (char === "\n") {
      fragment.append(document.createElement("br"));
      return;
    }
    const span = document.createElement("span");
    span.className = "joe_about__title-char";
    span.setAttribute("aria-hidden", "true");
    span.textContent = char;
    fragment.append(span);
  });
  title.setAttribute("aria-label", text);
  title.replaceChildren(fragment);
  return () => {
    title.textContent = text;
    if (previousLabel === null) title.removeAttribute("aria-label");
    else title.setAttribute("aria-label", previousLabel);
  };
}
export function animateAboutEntrance(
  root: HTMLElement,
  options: AboutMotionOptions,
): void {
  if (!options.entrance) return;
  const { speed, strength } = options;
  const entrance = gsap.timeline({
    defaults: { duration: 0.75 / speed, ease: "power3.out" },
  });
  entrance
    .from(
      root.querySelector(".joe_about__hello"),
      { y: 30 * strength, scale: 0.97, autoAlpha: 0 },
      0,
    )
    .from(
      root.querySelectorAll("[data-about-intro]"),
      { y: 25 * strength, autoAlpha: 0, stagger: 0.07 / speed },
      0.1,
    )
    .from(
      root.querySelectorAll(".joe_about__title-char"),
      {
        yPercent: 90 * strength,
        rotation: 7 * strength,
        autoAlpha: 0,
        stagger: 0.022 / speed,
        duration: 0.65 / speed,
        ease: "back.out(1.3)",
      },
      0.18,
    )
    .from(
      root.querySelector("[data-about-stage]"),
      {
        y: 40 * strength,
        rotation: 4 * strength,
        scale: 0.93,
        autoAlpha: 0,
        duration: 1 / speed,
        ease: "back.out(1.3)",
      },
      0.12,
    )
    .from(
      root.querySelectorAll("[data-about-tag]"),
      {
        scale: 0.35,
        autoAlpha: 0,
        stagger: 0.07 / speed,
        ease: "back.out(1.7)",
      },
      0.5,
    )
    .from(
      root.querySelectorAll("[data-about-stat]"),
      { y: 20 * strength, autoAlpha: 0, stagger: 0.08 / speed },
      0.55,
    );
  const wave = root.querySelector(".joe_about__wave");
  if (wave)
    entrance.fromTo(
      wave,
      { rotation: -20 },
      {
        rotation: 20,
        repeat: 3,
        yoyo: true,
        duration: 0.16 / speed,
        clearProps: "transform",
      },
      0.6,
    );
  root
    .querySelectorAll<HTMLElement>("[data-about-stat] strong")
    .forEach((count) => {
      const target = Number(count.textContent);
      if (Number.isFinite(target))
        gsap.fromTo(
          count,
          { textContent: 0 },
          {
            textContent: target,
            snap: { textContent: 1 },
            duration: 1.3 / speed,
            ease: "power2.out",
            scrollTrigger: { trigger: count, start: "top 95%", once: true },
          },
        );
    });
  root.querySelectorAll<HTMLElement>("[data-about-module]").forEach((card) => {
    if (!card.getBoundingClientRect().width) return;
    gsap.from(card, {
      y: 45 * strength,
      rotationX: 5 * strength,
      transformPerspective: 1000,
      autoAlpha: 0,
      duration: 0.8 / speed,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 94%", once: true },
    });
    const items = card.querySelectorAll(
      "[data-about-tool], [data-about-interest], [data-about-note], .joe_about__focus-list li",
    );
    if (items.length)
      gsap.from(items, {
        y: 20 * strength,
        scale: 0.93,
        autoAlpha: 0,
        duration: 0.55 / speed,
        stagger: 0.06 / speed,
        ease: "back.out(1.2)",
        scrollTrigger: { trigger: card, start: "top 90%", once: true },
      });
  });
}
