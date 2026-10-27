/** 首页：轮播、大图、加载更多 */
import { $, headerOffset, onReady } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { initBanner } from "../features/banner";
import { initBigBanner } from "../features/big-banner";
import { initReveal } from "../features/reveal";

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
    new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && void load(),
      { threshold: 1 },
    ).observe(container);
  }
}

onReady(() => {
  initBigBanner();
  initLoadMore();
  void initBanner();
});
