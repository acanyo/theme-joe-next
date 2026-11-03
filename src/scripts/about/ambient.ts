/** 短句轮换、技能漂浮和封面视差；循环动画在视口外或后台停止。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AboutMotionOptions } from "./options";
export function animateAboutAmbient(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  const stops: (() => void)[] = [];
  const loops: {
    element: HTMLElement;
    timeline: gsap.core.Timeline;
    visible: boolean;
  }[] = [];
  const add = (element: HTMLElement, timeline: gsap.core.Timeline) => {
    const item = {
      element,
      timeline,
      visible: ScrollTrigger.isInViewport(element),
    };
    loops.push(item);
    ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        item.visible = self.isActive;
        timeline.paused(!item.visible || document.hidden);
      },
    });
    timeline.paused(!item.visible || document.hidden);
  };
  if (options.ambient) {
    const roles = root.querySelector<HTMLElement>("[data-about-roles]");
    if (roles && roles.children.length > 1) {
      const first = roles.firstElementChild!.cloneNode(true) as HTMLElement;
      first.setAttribute("aria-hidden", "true");
      roles.append(first);
      const timeline = gsap.timeline({ paused: true, repeat: -1 });
      for (let i = 1; i < roles.children.length; i++)
        timeline.to(
          roles,
          { y: -26 * i, duration: 0.6 / options.speed, ease: "power3.inOut" },
          "+=2.1",
        );
      timeline.set(roles, { y: 0 });
      add(roles.parentElement!, timeline);
      stops.push(() => first.remove());
    }
    const hero = root.querySelector<HTMLElement>(".joe_about__hello");
    if (hero)
      add(
        hero,
        gsap
          .timeline({ paused: true })
          .to(hero.querySelectorAll("[data-about-orb]"), {
            x: 18 * options.strength,
            y: 24 * options.strength,
            rotation: 15,
            duration: 5 / options.speed,
            repeat: -1,
            yoyo: true,
            stagger: 0.8,
            ease: "sine.inOut",
          }),
      );
  }
  if (options.skillDrift) {
    const toolkit = root.querySelector<HTMLElement>(".joe_about__toolkit");
    if (toolkit)
      add(
        toolkit,
        gsap
          .timeline({ paused: true })
          .to(toolkit.querySelectorAll(".joe_about__tool-mark"), {
            y: -6 * options.strength,
            rotation: 3 * options.strength,
            duration: 2 / options.speed,
            repeat: -1,
            yoyo: true,
            stagger: { each: 0.16, from: "center" },
            ease: "sine.inOut",
          }),
      );
  }
  if (options.parallax)
    root
      .querySelectorAll<HTMLElement>(".joe_about__project")
      .forEach((card) => {
        const cover = card.querySelector(".joe_about__project-cover img");
        const targets = cover
          ? [cover]
          : [
              ...card.querySelectorAll(
                ".joe_about__project-art-icon, .joe_about__project-art-name",
              ),
            ];
        if (targets.length)
          gsap.fromTo(
            targets,
            { y: 10 * options.strength },
            {
              y: -12 * options.strength,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            },
          );
      });
  const sync = () =>
    loops.forEach((item) =>
      item.timeline.paused(!item.visible || document.hidden),
    );
  document.addEventListener("visibilitychange", sync);
  return () => {
    document.removeEventListener("visibilitychange", sync);
    stops.forEach((stop) => stop());
  };
}
