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
  $$(".joe_header__slideout, .joe_header__toc").forEach(
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

/**
 * 滚动时：离开顶部后胶囊收紧（.is-compact）；未开启吸顶时，向下滚动隐藏、向上滚动显示（.active）。
 * 侧栏吸顶位置由 CSS 变量 --sticky-top 控制，这里只同步导航是否隐藏。
 */
function initHeaderScroll(): void {
  const header = $(".joe_header__above");
  if (!header) return;
  const autoHide = !isMobile() && !getThemeConfig().enableFixedHeader;
  const root = document.documentElement;
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle("is-compact", y > 24);
    const hide = autoHide && y > lastY && y > 120;
    header.classList.toggle("active", hide);
    root.classList.toggle("nav-hidden", hide);
    lastY = y;
  };
  update();
  document.addEventListener("scroll", throttle(update, 80), { passive: true });
}

/** 菜单下方的玻璃滑块：停在当前项，鼠标悬停时滑到对应项 */
function initNavPill(): void {
  const nav = $(".joe_header__above-nav");
  if (!nav) return;
  const moveTo = (item: HTMLElement | null) => {
    if (!item) {
      nav.style.setProperty("--pill-o", "0");
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    nav.style.setProperty("--pill-x", `${box.left - navBox.left}px`);
    nav.style.setProperty("--pill-w", `${box.width}px`);
    nav.style.setProperty("--pill-o", "1");
  };
  // 当前项可能是一级链接，也可能在某个下拉菜单里（此时高亮整个下拉项）
  const current = () => {
    const link = $<HTMLElement>("a.item.current", nav);
    return link?.closest<HTMLElement>(".joe_dropdown") ?? link;
  };
  const topItems = () =>
    $$<HTMLElement>(":scope > a.item, :scope > .joe_dropdown", nav);
  for (const item of topItems())
    item.addEventListener("mouseenter", () => moveTo(item));
  nav.addEventListener("mouseleave", () => moveTo(current()));
  pillToCurrent = () => moveTo(current());
  // 字体加载完成后宽度会变化
  void document.fonts?.ready.then(() => pillToCurrent());
  window.addEventListener("resize", throttle(() => pillToCurrent(), 150));
}

let pillToCurrent = (): void => {};

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
  highlightCurrentMenu();
  initNavPill();
}

/** 切页后同步导航状态 */
export function refreshNavigation(): void {
  highlightCurrentMenu();
  pillToCurrent();
  if (document.documentElement.classList.contains("disable-scroll"))
    closeOverlays(false);
}
