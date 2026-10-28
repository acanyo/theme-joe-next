/**
 * 图库：CSS 多列瀑布流（替代 Isotope）、分组筛选、滚动加载下一页、灯箱预览。
 */
import { $, $$ } from "../core/dom";
import { initReveal } from "../features/reveal";
import { loadStylesheet } from "../core/stylesheet";
import photoswipeCss from "photoswipe/style.css?url";
import { observe } from "../core/lifecycle";

let activeGroup = "*";

function applyFilter(grid: HTMLElement): void {
  $$<HTMLElement>(".grid-item", grid).forEach((item) => {
    item.hidden = activeGroup !== "*" && item.dataset.group !== activeGroup;
  });
}

function initFilter(grid: HTMLElement): void {
  $$<HTMLButtonElement>("[data-joe-photo-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      activeGroup = button.dataset.joePhotoFilter ?? "*";
      $$(".joe_photos__filter li").forEach((li) =>
        li.classList.toggle("active", li.contains(button)),
      );
      applyFilter(grid);
    }),
  );
}

function initInfiniteScroll(grid: HTMLElement): void {
  const loading = $(".joe_loading");
  if (!loading || !("IntersectionObserver" in window)) return;
  let busy = false;
  const observer = observe(async (entries) => {
    if (!entries[0]?.isIntersecting || busy) return;
    const next = grid.dataset.next;
    if (!next) {
      observer.disconnect();
      loading.remove();
      return;
    }
    busy = true;
    try {
      const doc = new DOMParser().parseFromString(
        await (await fetch(next)).text(),
        "text/html",
      );
      const nextGrid = doc.querySelector<HTMLElement>("#image-grid");
      nextGrid
        ?.querySelectorAll(".grid-item")
        .forEach((item) => grid.appendChild(item));
      grid.dataset.next = nextGrid?.dataset.next ?? "";
      applyFilter(grid);
      initReveal(grid);
    } catch (error) {
      console.error("[joe-next] 加载图库下一页失败", error);
      observer.disconnect();
    } finally {
      busy = false;
    }
  });
  observer.observe(loading);
}

function initLightbox(grid: HTMLElement): void {
  grid.addEventListener("click", async (event) => {
    const img = (event.target as HTMLElement).closest<HTMLImageElement>(
      ".grid-item img",
    );
    if (!img) return;
    const visible = $$<HTMLImageElement>(".grid-item:not([hidden]) img", grid);
    const [{ default: PhotoSwipeLightbox }] = await Promise.all([
      import("photoswipe/lightbox"),
      loadStylesheet(photoswipeCss),
    ]);
    const lightbox = new PhotoSwipeLightbox({
      dataSource: visible.map((el) => ({
        src: el.dataset.full || el.src,
        width: el.naturalWidth * 2 || 1600,
        height: el.naturalHeight * 2 || 1200,
        alt: el.alt,
      })),
      pswpModule: () => import("photoswipe"),
    });
    lightbox.init();
    lightbox.loadAndOpen(visible.indexOf(img));
  });
}

export default function init(): void {
  const grid = $("#image-grid");
  if (!grid) return;
  initFilter(grid);
  initInfiniteScroll(grid);
  initLightbox(grid);
}
