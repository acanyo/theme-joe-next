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

/**
 * 锁定滚动时 body 改为 fixed，文档的滚动位置会变为 0 并触发 scroll 事件；
 * 页面实际并没有移动，这些事件在捕获阶段拦下，避免目录高亮、阅读进度等按 0 重新计算。
 */
document.addEventListener(
  "scroll",
  (event) => {
    if (document.documentElement.classList.contains("disable-scroll")) event.stopImmediatePropagation();
  },
  { capture: true },
);

function openOverlay(target: HTMLElement | null): void {
  if (!target) return;
  savedScroll = window.scrollY;
  const root = document.documentElement;
  root.style.setProperty("--scroll-lock-top", `${-savedScroll}px`);
  root.classList.add("disable-scroll");
  $(".joe_header__mask")?.classList.add("active", "slideout");
  target.classList.add("active");
}

/** 关闭抽屉与遮罩；restoreScroll 为 false 时不恢复打开前的滚动位置（切页场景） */
export function closeOverlays(restoreScroll = true): void {
  const root = document.documentElement;
  const wasLocked = root.classList.contains("disable-scroll");
  root.classList.remove("disable-scroll");
  root.style.removeProperty("--scroll-lock-top");
  $(".joe_header__mask")?.classList.remove("active", "slideout");
  $$(".joe_header__slideout, .joe_header__searchout, .joe_header__toc").forEach(
    (el) => el.classList.remove("active"),
  );
  // 立即回到原位置（不走平滑滚动），之后的目录跳转再平滑滚动到目标标题
  if (restoreScroll && wasLocked) window.scrollTo({ top: savedScroll, behavior: "instant" });
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
 * 阅读条导航（navbar.style = islands）的附加交互，经典样式下不执行：
 * - 页面顶部时 .is-top（透明），离开顶部后是一整条玻璃条
 * - 文章页向下阅读时 .is-reading：中间一段由菜单换成当前章节（见 nav-chapter.ts），向上滚动恢复菜单
 * - 底边阅读进度线（--read 0~1）：只在文章页且开启了「阅读进度条」时显示（#swup 的 data-joe-progress 为颜色）
 * - 当前菜单项下方的主题色下划线随鼠标在菜单项之间滑动（--bar-x / --bar-w）
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
      const hasChapter = !$(".joe_header__chapter")?.hidden;
      header.classList.toggle("is-reading", hasChapter && delta > 0 && y > 240);
      lastY = y;
    }
    if (y < 24) {
      header.classList.remove("is-reading");
      lastY = y;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty(
      "--read",
      (max > 0 ? Math.min(1, y / max) : 0).toFixed(4),
    );
  };
  syncProgress = () => {
    const color = $("#swup")?.dataset.joeProgress ?? "";
    header.classList.toggle("has-progress", !!color);
    header.style.setProperty("--read-color", color || "var(--theme)");
  };
  syncProgress();
  update();
  document.addEventListener("scroll", throttle(update, 50), { passive: true });
  refreshIslands = update;
}

let refreshIslands = (): void => {};
let syncProgress = (): void => {};

/** 菜单下方的主题色下划线：停在当前项，鼠标悬停时滑到对应项 */
function initNavBar(): void {
  const nav = $(".joe_header__above-nav");
  if (!nav || !isIslands()) return;
  const moveTo = (item: HTMLElement | null) => {
    if (!item) {
      nav.style.setProperty("--bar-o", "0");
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    nav.style.setProperty("--bar-x", `${box.left - navBox.left + 14}px`);
    nav.style.setProperty("--bar-w", `${Math.max(0, box.width - 28)}px`);
    nav.style.setProperty("--bar-o", "1");
  };
  // 当前项可能是一级链接，也可能在某个下拉菜单里（此时停在整个下拉项上）
  const current = () => {
    const link = $<HTMLElement>("a.item.current", nav);
    return link?.closest<HTMLElement>(".joe_dropdown") ?? link;
  };
  for (const item of $$<HTMLElement>(":scope > a.item, :scope > .joe_dropdown", nav))
    item.addEventListener("mouseenter", () => moveTo(item));
  nav.addEventListener("mouseleave", () => moveTo(current()));
  barToCurrent = () => moveTo(current());
  void document.fonts?.ready.then(() => barToCurrent());
  window.addEventListener("resize", throttle(() => barToCurrent(), 150));
}

let barToCurrent = (): void => {};

function initSearch(): void {
  const buttons = $$("[data-joe-search]");
  buttons.forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.SearchWidget?.open();
    }),
  );
  if (!buttons.length) return;
  // ⌘K / Ctrl K 打开搜索；Windows / Linux 上提示改为 Ctrl K
  if (!/Mac|iPhone|iPad/.test(navigator.platform))
    $$(".joe_header__kbd").forEach((kbd) => (kbd.textContent = "Ctrl K"));
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
      return;
    event.preventDefault();
    window.SearchWidget?.open();
  });
}

export function initNavigation(): void {
  initDropdowns();
  initDrawer();
  initHeaderScroll();
  initSearch();
  initIslandsScroll();
  highlightCurrentMenu();
  initNavBar();
}

/** 切页后同步导航状态 */
export function refreshNavigation(): void {
  highlightCurrentMenu();
  syncProgress();
  refreshIslands();
  barToCurrent();
  if (document.documentElement.classList.contains("disable-scroll"))
    closeOverlays(false);
}
