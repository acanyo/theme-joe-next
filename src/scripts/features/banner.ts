/** 首页轮播（Swiper，仅在页面存在轮播时加载；只下载当前设置用到的模块与样式） */
import { $ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { loadStylesheet } from "../core/stylesheet";
import { onCleanup } from "../core/lifecycle";
import coreCss from "swiper/css?url";
import navigationCss from "swiper/css/navigation?url";
import paginationCss from "swiper/css/pagination?url";
import type { SwiperModule } from "swiper/types";

/** 切换效果（设置 home.carousel_effect）→ 对应模块与样式，按需下载 */
const EFFECTS: Record<string, () => Promise<[SwiperModule, string]>> = {
  fade: async () => [
    (await import("swiper/modules")).EffectFade,
    (await import("swiper/css/effect-fade?url")).default,
  ],
  cube: async () => [
    (await import("swiper/modules")).EffectCube,
    (await import("swiper/css/effect-cube?url")).default,
  ],
  coverflow: async () => [
    (await import("swiper/modules")).EffectCoverflow,
    (await import("swiper/css/effect-coverflow?url")).default,
  ],
  flip: async () => [
    (await import("swiper/modules")).EffectFlip,
    (await import("swiper/css/effect-flip?url")).default,
  ],
  cards: async () => [
    (await import("swiper/modules")).EffectCards,
    (await import("swiper/css/effect-cards?url")).default,
  ],
  creative: async () => [
    (await import("swiper/modules")).EffectCreative,
    (await import("swiper/css/effect-creative?url")).default,
  ],
};

export async function initBanner(): Promise<void> {
  const el = $("[data-joe-banner]");
  if (!el || !el.querySelector(".swiper-slide")) return;
  // 第一张在首屏：不要等懒加载，立即以高优先级下载（Swiper 稍后才加载）
  const first = el.querySelector<HTMLImageElement>(".swiper-slide img");
  if (first) {
    first.loading = "eager";
    first.fetchPriority = "high";
  }
  const banner = getThemeConfig().banner;
  const effect = EFFECTS[banner.effect] as (typeof EFFECTS)[string] | undefined;
  const [{ default: Swiper }, autoplay, pagination, navigation, effectModule] =
    await Promise.all([
      import("swiper"),
      banner.autoplay ? import("swiper/modules").then((m) => m.Autoplay) : undefined,
      import("swiper/modules").then((m) => m.Pagination),
      import("swiper/modules").then((m) => m.Navigation),
      effect?.(),
      loadStylesheet(coreCss),
      loadStylesheet(paginationCss),
      loadStylesheet(navigationCss),
    ]);
  if (effectModule) await loadStylesheet(effectModule[1]);
  const modules = [
    pagination,
    navigation,
    autoplay,
    effectModule?.[0],
  ].filter((m): m is SwiperModule => !!m);
  const swiper = new Swiper(el, {
    modules,
    direction: banner.direction,
    loop: banner.loop,
    effect: (effect ? banner.effect : "slide") as "slide",
    // 淡入淡出：切换时旧图淡出、新图淡入，不是当前的幻灯片保持完全透明
    fadeEffect: { crossFade: true },
    speed: banner.speed,
    grabCursor: banner.handle,
    allowTouchMove: banner.handle,
    autoplay: banner.autoplay
      ? { delay: banner.delay, disableOnInteraction: false }
      : false,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
  onCleanup(() => swiper.destroy(true, true));
}
