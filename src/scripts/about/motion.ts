/** 动效总入口：配置、系统偏好与切页清理在此收敛，各个场景独立实现。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animateAboutEntrance, prepareAboutHeadline } from "./entrance";
import { animateAboutAvatar } from "./avatar";
import { animateAboutAmbient } from "./ambient";
import { animateAboutInteractions } from "./interactions";
import { initAboutProjects } from "./projects";
import type { AboutMotionOptions } from "./options";
gsap.registerPlugin(ScrollTrigger);
export function initAboutMotion(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  const restoreHeadline = prepareAboutHeadline(root);
  const stopProjects = initAboutProjects(root, options);
  let media = gsap.matchMedia();
  let disabled = document.documentElement.classList.contains("joe-no-motion");
  const sync = () => {
    media.revert();
    media = gsap.matchMedia();
    media.add(
      {
        always: "(min-width: 0px)",
        reduced: "(prefers-reduced-motion: reduce)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        if (
          context.conditions?.reduced ||
          disabled ||
          options.mode === "off" ||
          root.dataset.aboutMotion === "false"
        )
          return animateAboutAvatar(root, false, options, false);
        animateAboutEntrance(root, options);
        const stops = [
          animateAboutAvatar(root, !!context.conditions?.fine, options),
          animateAboutAmbient(root, options),
        ];
        if (context.conditions?.fine)
          stops.push(animateAboutInteractions(root, options));
        return () => stops.forEach((stop) => stop());
      },
      root,
    );
  };
  sync();
  const prefs = new MutationObserver(() => {
    const next = document.documentElement.classList.contains("joe-no-motion");
    if (next !== disabled) {
      disabled = next;
      sync();
    }
  });
  prefs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  let active = true;
  void document.fonts.ready.then(() => {
    if (active && root.isConnected) ScrollTrigger.refresh();
  });
  return () => {
    active = false;
    prefs.disconnect();
    media.revert();
    stopProjects();
    restoreHeadline();
  };
}
