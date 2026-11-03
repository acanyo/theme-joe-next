/** 影像入场与滚动后景深变化，动作集中在照片和内容的层级关系。 */
import { gsap } from "gsap";
import type { AboutMotionOptions } from "../options";
export function animateAuthorScene(
  root: HTMLElement,
  options: AboutMotionOptions,
  fine: boolean,
): () => void {
  const scene = root.querySelector<HTMLElement>("[data-author-scene]");
  const hero = root.querySelector<HTMLElement>("[data-author-hero]");
  const backdrop = root.querySelector<HTMLElement>("[data-author-backdrop]");
  const foreground = root.querySelector<HTMLElement>(
    "[data-author-foreground]",
  );
  const word = root.querySelector<HTMLElement>("[data-author-word]");
  const content = root.querySelector<HTMLElement>("[data-author-content]");
  if (!hero || !scene || !backdrop) return () => {};
  if (options.entrance) {
    const entry = gsap.timeline({ defaults: { ease: "power3.out" } });
    entry.from(
      backdrop,
      { scale: 1.08, autoAlpha: 0, duration: 1.4 / options.speed },
      0,
    );
    if (foreground)
      entry.from(
        foreground,
        { y: 50, autoAlpha: 0, duration: 1.2 / options.speed },
        0.15,
      );
    entry.from(
      hero.querySelectorAll("h1,.joe_about__actions,.joe_author__hero-note"),
      { y: 22, autoAlpha: 0, stagger: 0.15, duration: 0.85 / options.speed },
      0.35,
    );
  }
  if (options.parallax) {
    const scroll = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top+=90",
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
    scroll.to(
      backdrop,
      {
        scale: 1.08,
        filter: "blur(8px)",
        ease: "none",
      },
      0,
    );
    if (foreground)
      scroll.to(
        foreground,
        { y: -60, autoAlpha: 0.12, filter: "blur(9px)", ease: "none" },
        0,
      );
    if (word) scroll.to(word, { xPercent: -8, autoAlpha: 0, ease: "none" }, 0);
  }
  if (content && options.entrance)
    gsap.from(content, {
      y: 22,
      autoAlpha: 0,
      duration: 0.7 / options.speed,
      ease: "power2.out",
      scrollTrigger: { trigger: content, start: "top 96%", once: true },
    });
  let stop = () => {};
  if (fine && options.hover) {
    const target = foreground || backdrop;
    const x = gsap.quickTo(target, "x", { duration: 0.9, ease: "power2.out" });
    let frame = 0;
    let local = 0;
    const move = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      local = (event.clientX - rect.left) / rect.width - 0.5;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          x(local * 18);
        });
    };
    const leave = () => x(0);
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    stop = () => {
      if (frame) cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
    };
  }
  return stop;
}
