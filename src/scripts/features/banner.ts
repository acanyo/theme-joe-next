/** 首页轮播（Swiper，仅在页面存在轮播时加载） */
import { $ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { loadStylesheet } from "../core/stylesheet";
import swiperCss from "swiper/css/bundle?url";

export async function initBanner(): Promise<void> {
  const el = $("[data-joe-banner]");
  if (!el || !el.querySelector(".swiper-slide")) return;
  const banner = getThemeConfig().banner;
  const [{ default: Swiper }, modules] = await Promise.all([
    import("swiper"),
    import("swiper/modules"),
    loadStylesheet(swiperCss),
  ]);
  new Swiper(el, {
    modules: [
      modules.Autoplay,
      modules.Pagination,
      modules.Navigation,
      modules.EffectFade,
      modules.EffectCube,
      modules.EffectCoverflow,
      modules.EffectFlip,
      modules.EffectCards,
      modules.EffectCreative,
    ],
    direction: banner.direction,
    loop: banner.loop,
    effect: banner.effect as "slide",
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
}
