/**
 * 导航栏：当前菜单高亮、下拉菜单、移动端抽屉、滚动隐藏头部、搜索入口。
 *
 * 导航位于 swup 容器之外，切页时不会被替换：交互只需绑定一次（initNavigation），
 * 每次切页后调用 refreshNavigation 同步当前菜单高亮并关闭打开的抽屉。
 */
import { $, $$, isMobile, throttle } from "../core/dom";
import { getThemeConfig } from "../core/config";

declare global {
  interface Window {
    SearchWidget?: { open: () => void };
  }
}

function highlightCurrentMenu(): void {
  const { pathname } = location;
  $$(".joe_header .current").forEach((el) => el.classList.remove("current"));
  const links = $$<HTMLAnchorElement>(".joe_header__above-nav a.item");
  let best: HTMLAnchorElement | undefined;
  let bestLength = -1;
  for (const link of links) {
    const href = link.getAttribute("href");
    if (!href) continue;
    const path = new URL(href, location.origin).pathname;
    const matches =
      path === "/"
        ? pathname === "/"
        : pathname === path ||
          pathname.startsWith(`${path.replace(/\/$/, "")}/`);
    if (matches && path.length > bestLength) {
      best = link;
      bestLength = path.length;
    }
  }
  if (!best) return;
  best.classList.add("current");
  best
    .closest(".joe_dropdown")
    ?.querySelector(".joe_dropdown__link a")
    ?.classList.add("current");
  const index = links.indexOf(best);
  $$(".panel-side-menu .link")[index]?.classList.add("current");
}

function initDropdowns(): void {
  $$(".joe_dropdown").forEach((dropdown) => {
    const trigger = dropdown.dataset.trigger ?? "click";
    if (trigger === "hover") {
      dropdown.addEventListener("mouseenter", () =>
        dropdown.classList.add("active"),
      );
      dropdown.addEventListener("mouseleave", () =>
        dropdown.classList.remove("active"),
      );
      return;
    }
    dropdown.addEventListener("click", (event) => {
      event.stopPropagation();
      dropdown.classList.toggle("active");
      document.addEventListener(
        "click",
        () => dropdown.classList.remove("active"),
        { once: true },
      );
    });
  });
}

let savedScroll = 0;

function openOverlay(target: HTMLElement | null): void {
  if (!target) return;
  savedScroll = window.scrollY;
  document.documentElement.classList.add("disable-scroll");
  $(".joe_header__mask")?.classList.add("active", "slideout");
  target.classList.add("active");
}

/** 关闭抽屉与遮罩；restoreScroll 为 false 时不恢复打开前的滚动位置（切页场景） */
export function closeOverlays(restoreScroll = true): void {
  document.documentElement.classList.remove("disable-scroll");
  $(".joe_header__mask")?.classList.remove("active", "slideout");
  $$(".joe_header__slideout, .joe_header__searchout, .joe_header__toc").forEach(
    (el) => el.classList.remove("active"),
  );
  if (restoreScroll) window.scrollTo({ top: savedScroll });
}

/** 打开移动端目录抽屉（供文章页使用） */
export function openTocDrawer(): void {
  openOverlay($(".joe_header__toc"));
}

function initDrawer(): void {
  const slideout = $(".joe_header__slideout");
  $(".joe_header__above-slideicon")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (slideout?.classList.contains("active")) closeOverlays();
    else openOverlay(slideout);
  });
  $(".joe_header__mask")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeOverlays();
  });

  // 侧栏菜单手风琴：点击带子菜单的项的箭头区域展开/收起，点击其中的真实链接正常跳转
  $$(".joe_header__slideout-menu .panel").forEach((panel) => {
    panel.addEventListener("click", (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (link && link.getAttribute("href") !== "#") return;
      event.preventDefault();
      event.stopPropagation();
      const body = panel.parentElement?.querySelector<HTMLElement>(
        ":scope > .panel-body",
      );
      const open = !panel.classList.contains("in");
      panel.classList.toggle("in", open);
      if (body) body.style.display = open ? "block" : "none";
    });
  });
  $$(".joe_header__slideout-menu .current").forEach((current) => {
    let body = current.closest<HTMLElement>(".panel-body");
    while (body) {
      body.style.display = "block";
      body.parentElement?.querySelector(":scope > .panel")?.classList.add("in");
      body = body.parentElement?.closest<HTMLElement>(".panel-body") ?? null;
    }
  });
}

function initHeaderScroll(): void {
  if (isMobile() || getThemeConfig().enableFixedHeader) return;
  const header = $(".joe_header__above");
  if (!header) return;
  const headerHeight = header.offsetHeight;
  let lastY = 0;
  document.addEventListener(
    "scroll",
    throttle(() => {
      const y = window.scrollY;
      const hide = y > lastY && y > headerHeight;
      header.classList.toggle("active", hide);
      // 侧栏吸顶元素随页面替换，每次滚动时重新查询
      $$(".joe_aside_post, .joe_aside .joe_aside__item:last-child").forEach(
        (el) => (el.style.top = `${hide ? 15 : headerHeight + 15}px`),
      );
      lastY = y;
    }, 100),
  );
}

function initSearch(): void {
  $$("[data-joe-search]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.SearchWidget?.open();
    }),
  );
}

export function initNavigation(): void {
  initDropdowns();
  initDrawer();
  initHeaderScroll();
  initSearch();
}

/** 切页后同步导航状态 */
export function refreshNavigation(): void {
  highlightCurrentMenu();
  if (document.documentElement.classList.contains("disable-scroll"))
    closeOverlays(false);
}
