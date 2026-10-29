/**
 * 首页分类标签页（pages/index.astro，设置 home.category_tabs）：
 * 点击分类后抓取该分类页，把文章列表在原地换成这个分类的文章，不跳转页面。
 *
 * - 服务端输出全部分类，这里按文章数排序后保留前 data-max 个
 * - 切到分类时，列表下方的分页 / 加载更多换成「查看该分类全部 n 篇」链接；切回「最新文章」时还原
 * - 已加载过的分类缓存在内存中，来回切换不重复请求
 * - 切换时列表淡出淡入，系统「减少动态效果」下直接替换
 */
import { $, $$ } from "../core/dom";
import { cleanExcerpts } from "../content/excerpt";
import { fillEmptyImages } from "./image-fallback";
import { initReveal } from "./reveal";

/** 分类页的文章列表与首页列表的条目结构相同（components/list/PostItem.astro） */
const ITEM = ".joe_list__item";

export function initCategoryTabs(): void {
  const tabs = $("[data-joe-category-tabs]");
  const list = $("[data-joe-post-list]");
  if (!tabs || !list) return;

  const [latest, ...cats] = $$<HTMLButtonElement>("button[role=tab]", tabs);
  if (!latest || !cats.length) return;

  // 按文章数从多到少，保留前 max 个
  const max = Number(tabs.dataset.max) || 5;
  cats
    .sort((a, b) => Number(b.dataset.count) - Number(a.dataset.count))
    .forEach((button, i) => (i < max ? tabs.appendChild(button) : button.remove()));
  const buttons = $$<HTMLButtonElement>("button[role=tab]", tabs);

  // 分页（<nav><ul class="joe_pagination">）与加载更多都在 .joe_main 下，与 .joe_index 同级
  const footer = list.closest(".joe_main");
  const original = { items: [...list.children], tail: footerNodes(footer) };
  const cache = new Map<string, { items: Element[]; total: number }>();
  let pending = 0;

  const select = async (button: HTMLButtonElement) => {
    if (button.getAttribute("aria-selected") === "true") return;
    buttons.forEach((b) => {
      const on = b === button;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const request = ++pending;
    list.setAttribute("aria-busy", "true");
    list.classList.add("is-switching");

    if (button === latest) {
      swap(list, original.items);
      restoreFooter(footer, original.tail);
    } else {
      const href = button.dataset.href!;
      let data = cache.get(href);
      if (!data) {
        try {
          const doc = new DOMParser().parseFromString(await (await fetch(href)).text(), "text/html");
          const items = [...doc.querySelectorAll(`.joe_archive__list ${ITEM}, [data-joe-post-list] ${ITEM}`)];
          data = { items, total: Number(button.dataset.count) || items.length };
          cache.set(href, data);
        } catch (error) {
          console.error("[joe-next] 分类文章加载失败", error);
          location.href = href;
          return;
        }
      }
      if (request !== pending) return; // 已切到别的标签
      swap(list, data.items.map((n) => n.cloneNode(true) as Element));
      replaceFooter(footer, href, button.textContent?.trim() ?? "", data.total, data.items.length);
    }
    cleanExcerpts(list);
    fillEmptyImages(list);
    initReveal(list);
    requestAnimationFrame(() => list.classList.remove("is-switching"));
    list.removeAttribute("aria-busy");
  };

  buttons.forEach((button) => button.addEventListener("click", () => void select(button)));

  // 键盘：左右方向键在标签之间移动
  tabs.addEventListener("keydown", (event) => {
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0 || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
    event.preventDefault();
    const next = buttons[(i + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length]!;
    next.focus();
    void select(next);
  });
}

function swap(list: HTMLElement, items: Element[]): void {
  list.replaceChildren(...items);
}

/** 列表下方的分页与加载更多 */
function footerNodes(footer: Element | null | undefined): Element[] {
  if (!footer) return [];
  return [...footer.children].filter(
    (n) => n.matches(".joe_load_container") || !!n.querySelector(":scope > .joe_pagination"),
  );
}

function restoreFooter(footer: Element | null | undefined, nodes: Element[]): void {
  if (!footer) return;
  footer.querySelector(":scope > .joe_index__more")?.remove();
  nodes.forEach((n) => footer.insertBefore(n, tailAnchor(footer)));
}

function replaceFooter(
  footer: Element | null | undefined,
  href: string,
  name: string,
  total: number,
  shown: number,
): void {
  if (!footer) return;
  footerNodes(footer).forEach((n) => n.remove());
  footer.querySelector(":scope > .joe_index__more")?.remove();
  if (total <= shown) return;
  const more = document.createElement("a");
  more.className = "joe_index__more";
  more.href = href;
  more.textContent = `查看「${name}」全部 ${total} 篇文章`;
  footer.insertBefore(more, tailAnchor(footer));
}

/** 分页与「查看全部」放在分类橱窗（components/home/CategoryShowcase.astro）之前；没有橱窗时追加到末尾 */
function tailAnchor(footer: Element): Element | null {
  return footer.querySelector(":scope > .joe_showcase");
}
