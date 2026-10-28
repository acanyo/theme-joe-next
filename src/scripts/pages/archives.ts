/** 归档页：时间轴折叠 */
import { $$ } from "../core/dom";

export default function init(): void {
  $$(".joe_archives-timelist .panel").forEach((panel) => {
    panel.setAttribute("role", "button");
    panel.tabIndex = 0;
    const toggle = () => {
      const open = !panel.classList.contains("in");
      panel.classList.toggle("in", open);
      const body = panel.nextElementSibling as HTMLElement | null;
      if (body) body.style.display = open ? "" : "none";
      panel.setAttribute("aria-expanded", String(open));
    };
    panel.addEventListener("click", toggle);
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });
}
