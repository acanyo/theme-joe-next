/**
 * 进入视口动画（替代 WOW.js）。
 * 元素声明 `class="joe-reveal" data-reveal="fadeInUp"`，进入视口时添加 animate.css 类名。
 */
import "animate.css/animate.min.css";
import { $$ } from "../core/dom";
import { observe } from "../core/lifecycle";

export function initReveal(root: ParentNode = document): void {
  const targets = $$<HTMLElement>(".joe-reveal:not(.animated)", root);
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach(show);
    return;
  }
  const observer = observe(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -40px 0px" },
  );
  targets.forEach((el) => observer.observe(el));
}

function show(el: HTMLElement): void {
  const effect = el.dataset.reveal || "fadeInUp";
  el.classList.add(
    "animated",
    "animate__animated",
    `animate__${effect}`,
    effect,
  );
}
