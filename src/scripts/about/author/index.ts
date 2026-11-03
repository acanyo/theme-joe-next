/** 作者页生命周期独立于彩色卡片模式，复用配置和作品筛选。 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initAuthorTabs } from "./tabs";
import { animateAuthorScene } from "./motion";
import { initAboutProjects } from "../projects";
import type { AboutMotionOptions } from "../options";
gsap.registerPlugin(ScrollTrigger);
export function initAboutAuthor(
  root: HTMLElement,
  options: AboutMotionOptions,
): () => void {
  const stopTabs = initAuthorTabs(root, options);
  const stopProjects = initAboutProjects(root, options);
  let media = gsap.matchMedia();
  let disabled = document.documentElement.classList.contains("joe-no-motion");
  const sync = () => {
    media.revert();
    media = gsap.matchMedia();
    media.add(
      {
        always: "(min-width:0px)",
        reduced: "(prefers-reduced-motion:reduce)",
        fine: "(hover:hover) and (pointer:fine)",
      },
      (context) => {
        if (
          context.conditions?.reduced ||
          disabled ||
          options.mode === "off" ||
          root.dataset.aboutMotion === "false"
        )
          return;
        return animateAuthorScene(root, options, !!context.conditions?.fine);
      },
      root,
    );
  };
  sync();
  const observer = new MutationObserver(() => {
    const value = document.documentElement.classList.contains("joe-no-motion");
    if (value !== disabled) {
      disabled = value;
      sync();
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  let active = true;
  void document.fonts.ready.then(() => {
    if (active && root.isConnected) ScrollTrigger.refresh();
  });
  return () => {
    active = false;
    observer.disconnect();
    media.revert();
    stopProjects();
    stopTabs();
  };
}
