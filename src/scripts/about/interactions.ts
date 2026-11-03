/** 指针交互单独管理；每帧只读取一次目标边界，倾斜不改变布局。 */
import { gsap } from "gsap";
import type { AboutMotionOptions } from "./options";
export function animateAboutInteractions(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  if (!options.hover) return () => {};
  const stops: (() => void)[] = [];
  root
    .querySelectorAll<HTMLElement>(
      ".joe_about__project, [data-about-tool], [data-about-interest], .joe_about__hello",
    )
    .forEach((card) => {
      const scale = card.matches(".joe_about__project") ? 5 : 8;
      const x = gsap.quickTo(card, "rotationY", {
        duration: 0.55,
        ease: "power3.out",
      });
      const y = gsap.quickTo(card, "rotationX", {
        duration: 0.55,
        ease: "power3.out",
      });
      const lift = gsap.quickTo(card, "y", {
        duration: 0.35,
        ease: "power3.out",
      });
      let frame = 0;
      let point = { x: 0, y: 0 };
      const update = () => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        const localX = (point.x - rect.left) / rect.width - 0.5,
          localY = (point.y - rect.top) / rect.height - 0.5;
        x(localX * scale * options.strength);
        y(-localY * scale * options.strength);
        card.style.setProperty("--pointer-x", (localX + 0.5) * 100 + "%");
        card.style.setProperty("--pointer-y", (localY + 0.5) * 100 + "%");
      };
      const move = (event: PointerEvent) => {
        point = { x: event.clientX, y: event.clientY };
        if (!frame) frame = requestAnimationFrame(update);
      };
      const enter = () => {
        lift(card.matches(".joe_about__hello") ? -2 : -6 * options.strength);
        card.style.setProperty("--pointer-active", "1");
      };
      const leave = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        x(0);
        y(0);
        lift(0);
        card.style.removeProperty("--pointer-active");
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointerleave", leave);
      stops.push(() => {
        if (frame) cancelAnimationFrame(frame);
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("pointerleave", leave);
        card.style.removeProperty("--pointer-x");
        card.style.removeProperty("--pointer-y");
        card.style.removeProperty("--pointer-active");
      });
    });
  return () => stops.forEach((stop) => stop());
}
