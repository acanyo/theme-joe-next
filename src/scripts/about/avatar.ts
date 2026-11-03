/** 头像招呼、浮动与鼠标跟随；视口外或后台标签页暂停循环动画。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AboutMotionOptions } from "./options";

export function animateAboutAvatar(
  root: HTMLElement,
  finePointer: boolean,
  options: AboutMotionOptions,
  animate = true,
): () => void {
  const stage = root.querySelector<HTMLElement>("[data-about-stage]");
  const inner = root.querySelector<HTMLElement>("[data-about-stage-inner]");
  const button = root.querySelector<HTMLButtonElement>("[data-about-greet]");
  const message = root.querySelector<HTMLElement>("[data-about-greet-message]");
  if (!stage || !inner || !button || !message) return () => {};

  if (!animate) {
    let timer = 0;
    const greet = () => {
      clearTimeout(timer);
      message.hidden = false;
      timer = window.setTimeout(() => {
        message.hidden = true;
      }, 2600);
    };
    button.addEventListener("click", greet);
    return () => {
      clearTimeout(timer);
      message.hidden = true;
      button.removeEventListener("click", greet);
    };
  }

  const ambient = gsap.timeline({ paused: true });
  if (options.ambient) {
    ambient.to(
      root.querySelector("[data-about-orbit]"),
      { rotation: 360, duration: 28, repeat: -1, ease: "none" },
      0,
    );
    ambient.to(
      root.querySelector("[data-about-avatar-float]"),
      {
        y: -12 * options.strength,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      },
      0,
    );
    const tags = root.querySelectorAll("[data-about-tag] span");
    if (tags.length)
      ambient.to(
        tags,
        {
          y: -7 * options.strength,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.2, from: "center" },
          ease: "sine.inOut",
        },
        0,
      );
    ambient.to(
      root.querySelectorAll(".joe_about__spark"),
      {
        rotation: 30,
        scale: 0.8,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      },
      0,
    );
  }
  ambient.timeScale(options.speed);
  let visible = ScrollTrigger.isInViewport(stage);
  let hovered = false;
  let focused = false;
  const sync = () =>
    ambient.paused(!visible || document.hidden || hovered || focused);
  ScrollTrigger.create({
    trigger: stage,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      visible = self.isActive;
      sync();
    },
  });
  document.addEventListener("visibilitychange", sync);
  const enter = () => {
    hovered = true;
    sync();
  };
  const leaveStage = () => {
    hovered = false;
    sync();
  };
  const focus = () => {
    focused = true;
    sync();
  };
  const blur = (event: FocusEvent) => {
    focused =
      event.relatedTarget instanceof Node &&
      stage.contains(event.relatedTarget);
    sync();
  };
  stage.addEventListener("pointerenter", enter);
  stage.addEventListener("pointerleave", leaveStage);
  stage.addEventListener("focusin", focus);
  stage.addEventListener("focusout", blur);
  sync();

  const greeting = gsap.timeline({
    paused: true,
    onStart: () => {
      message.hidden = false;
    },
    onComplete: () => {
      message.hidden = true;
    },
  });
  greeting
    .fromTo(
      message,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.22 },
      0,
    )
    .to(
      button,
      { rotation: -12, scale: 1.1, duration: 0.18, ease: "power2.out" },
      0,
    )
    .to(button, {
      rotation: 12,
      duration: 0.18,
      repeat: 2,
      yoyo: true,
      ease: "sine.inOut",
    })
    .to(button, { rotation: 0, scale: 1, duration: 0.4, ease: "back.out(2)" })
    .to(message, { autoAlpha: 0, y: -8, duration: 0.25 }, 2.4);
  greeting.timeScale(options.speed);
  const particleContext = gsap.context(() => {}, root);
  const particles = new Set<HTMLElement>();
  const greet = () => {
    greeting.restart();
    if (!options.particles) return;
    particleContext.add(() => {
      for (let i = 0; i < 14; i++) {
        const particle = document.createElement("span");
        particle.className = "joe_about__particle";
        particle.setAttribute("aria-hidden", "true");
        particle.textContent = ["✦", "●", "▪"][i % 3];
        particle.style.color = ["#8575ee", "#e7a458", "#6dbb99", "#df79a4"][
          i % 4
        ];
        stage.append(particle);
        particles.add(particle);
        const angle = (i / 14) * Math.PI * 2;
        const distance = (90 + (i % 3) * 30) * options.strength;
        gsap.fromTo(
          particle,
          { x: 0, y: 0, scale: 0.5, autoAlpha: 1 },
          {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 30,
            scale: 0.1,
            autoAlpha: 0,
            rotation: i * 36,
            duration: 1.2 / options.speed,
            ease: "power2.out",
            onComplete: () => {
              particle.remove();
              particles.delete(particle);
            },
          },
        );
      }
    });
  };
  button.addEventListener("click", greet);

  let stopPointer = () => {};
  if (finePointer && options.hover) {
    const rotateX = gsap.quickTo(inner, "rotationX", {
      duration: 0.55,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(inner, "rotationY", {
      duration: 0.55,
      ease: "power3.out",
    });
    const move = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      rotateY(
        ((event.clientX - rect.left) / rect.width - 0.5) *
          18 *
          options.strength,
      );
      rotateX(
        -((event.clientY - rect.top) / rect.height - 0.5) *
          14 *
          options.strength,
      );
    };
    const leave = () => {
      rotateX(0);
      rotateY(0);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    stopPointer = () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }

  return () => {
    stopPointer();
    particleContext.revert();
    particles.forEach((particle) => particle.remove());
    document.removeEventListener("visibilitychange", sync);
    stage.removeEventListener("pointerenter", enter);
    stage.removeEventListener("pointerleave", leaveStage);
    stage.removeEventListener("focusin", focus);
    stage.removeEventListener("focusout", blur);
    button.removeEventListener("click", greet);
    message.hidden = true;
  };
}
