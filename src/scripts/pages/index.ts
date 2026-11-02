/** 首页：轮播、大图、瞬间叠放、加载更多 */
import { $, headerOffset } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { initBanner } from "../features/banner";
import { initBigBanner } from "../features/big-banner";
import { initMomentsStack } from "../features/moments-stack";
import { initReveal } from "../features/reveal";
import { cleanExcerpts } from "../content/excerpt";
import { fillEmptyImages } from "../features/image-fallback";
import { initCategoryTabs } from "../features/category-tabs";
import { initResumeBar } from "../features/resume-bar";
import { hideReadBadges } from "../features/freshness";
import { loadCommenters } from "../features/commenters";
import { observe } from "../core/lifecycle";

/** 「查看更多」：抓取下一页并追加文章；开启自动加载时进入视口即触发 */
function initLoadMore(): void {
  const container = $(".joe_load_container");
  const button = $<HTMLButtonElement>(".joe_load", container ?? document);
  const list = $("[data-joe-post-list]");
  if (!container || !button || !list) return;

  const load = async () => {
    const next = button.dataset.next;
    if (!next || button.dataset.loading === "true") return;
    button.dataset.loading = "true";
    button.textContent = "加载中...";
    const anchor = list.lastElementChild as HTMLElement | null;
    try {
      const doc = new DOMParser().parseFromString(
        await (await fetch(next)).text(),
        "text/html",
      );
      doc
        .querySelectorAll("[data-joe-post-list] > .joe_list__item")
        .forEach((item) => list.appendChild(item));
      cleanExcerpts(list);
      fillEmptyImages(list);
      hideReadBadges(list);
      loadCommenters(list);
      initReveal(list);
      const nextButton = doc.querySelector<HTMLButtonElement>(".joe_load");
      if (nextButton?.dataset.next) {
        button.dataset.next = nextButton.dataset.next;
        button.textContent = "查看更多";
      } else {
        container.remove();
      }
      if (anchor)
        window.scrollTo({
          top: anchor.offsetTop + anchor.offsetHeight - headerOffset(),
          behavior: "smooth",
        });
    } catch (error) {
      console.error("[joe-next] 加载更多文章失败", error);
      button.textContent = "加载失败，点击重试";
    } finally {
      button.dataset.loading = "false";
    }
  };

  button.addEventListener("click", () => void load());
  if (getThemeConfig().enableAutoAjax && "IntersectionObserver" in window) {
    observe((entries) => entries[0]?.isIntersecting && void load(), {
      threshold: 1,
    }).observe(container);
  }
}

export default function init(): void {
  initBigBanner();
  initMomentsStack();
  initLoadMore();
  initCategoryTabs();
  initResumeBar();
  void initBanner();
}
