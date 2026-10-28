/**
 * 进入视口动效：带 `data-motion` 的元素在首次进入视口时添加 `is-in`，
 * 具体动画由 styles/base/motion.css 定义（统一的弹性缓动，同组元素依次错开）。
 *
 * - `data-motion`：元素自身做入场动画
 * - `data-motion-group`：子元素中带 `data-motion` 的按出现顺序错开 60ms
 *
 * 系统开启「减少动态效果」时 CSS 直接显示最终状态，这里也不再观察。
 */
import { $$ } from "../core/dom";
import { observe } from "../core/lifecycle";

const STAGGER_MS = 60;
const MAX_STAGGER = 8;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stagger(root: ParentNode): void {
  for (const group of $$<HTMLElement>("[data-motion-group]", root)) {
    $$<HTMLElement>("[data-motion]", group).forEach((el, index) => {
      el.style.setProperty(
        "--motion-delay",
        `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`,
      );
    });
  }
}

export function initMotion(root: ParentNode = document): void {
  const targets = $$<HTMLElement>("[data-motion]:not(.is-in)", root);
  if (!targets.length) return;
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }
  stagger(root);
  const observer = observe(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((el) => observer.observe(el));
}
