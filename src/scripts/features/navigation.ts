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
  // 浮岛样式不整体隐藏导航，由 initIslandsScroll 处理
  if (isMobile() || getThemeConfig().enableFixedHeader || isIslands()) return;
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

/**
 * 浮岛导航（navbar.style = islands）的附加交互，经典样式下不执行：
 * - 页面顶部时 .is-top（透明），离开顶部后浮起
 * - 向下滚动时 .is-down：中间菜单收起，文章页换成文章标题（.show-title），首页等显示站点名；
 *   Logo 与右侧工具保留，向上滚动恢复菜单
 * - 右侧阅读进度圆环（--read 0~100），离开顶部后出现，点击回到顶部
 * - 菜单下方的主题色滑块停在当前项、随鼠标滑到悬停项
 */
const isIslands = () => !!$(".joe_header--islands");

function initIslandsScroll(): void {
  const header = $(".joe_header__above");
  if (!header || !isIslands()) return;
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    header.classList.toggle("is-top", y < 24);
    // 忽略细微抖动，避免触控板惯性滚动时来回切换
    if (Math.abs(delta) > 4) {
      const down = delta > 0 && y > 120;
      header.classList.toggle("is-down", down);
      header.classList.toggle("show-title", down && y > 240);
      lastY = y;
    }
    if (y < 24) {
      header.classList.remove("is-down", "show-title");
      lastY = y;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const read = max > 0 ? Math.round(Math.min(1, y / max) * 100) : 0;
    header.style.setProperty("--read", String(read));
    const value = $(".joe_header__progress .value", header);
    if (value) value.textContent = String(read);
  };
  $(".joe_header__progress", header)?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  update();
  document.addEventListener("scroll", throttle(update, 80), { passive: true });
  refreshIslands = update;
}

let refreshIslands = (): void => {};

/** 把当前页面的标题写入导航中间的标题胶囊（切页后调用）；没有文章标题的页面显示站点名 */
function syncPageTitle(): void {
  const button = $<HTMLButtonElement>(".joe_header__page-title");
  if (!button) return;
  button.textContent =
    $("#swup")?.dataset.joeTitle || button.dataset.siteTitle || "";
}

function initPageTitle(): void {
  $(".joe_header__page-title")?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

function initNavPill(): void {
  const nav = $(".joe_header__above-nav");
  if (!nav || !isIslands()) return;
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
  // 当前项可能是一级链接，也可能在某个下拉菜单里（此时停在整个下拉项上）
  const current = () => {
    const link = $<HTMLElement>("a.item.current", nav);
    return link?.closest<HTMLElement>(".joe_dropdown") ?? link;
  };
  for (const item of $$<HTMLElement>(":scope > a.item, :scope > .joe_dropdown", nav))
    item.addEventListener("mouseenter", () => moveTo(item));
  nav.addEventListener("mouseleave", () => moveTo(current()));
  pillToCurrent = () => moveTo(current());
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
  initPageTitle();
  syncPageTitle();
  initIslandsScroll();
  highlightCurrentMenu();
  initNavPill();
}

/** 切页后同步导航状态 */
export function refreshNavigation(): void {
  highlightCurrentMenu();
  syncPageTitle();
  refreshIslands();
  pillToCurrent();
  if (document.documentElement.classList.contains("disable-scroll"))
    closeOverlays(false);
}
