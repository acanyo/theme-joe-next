/**
 * 阅读条导航的「当前章节」：文章页向下阅读时，导航中间一段显示正在阅读的章节（§3/8 标题），
 * 点击展开迷你目录直接跳转。只在浮岛（阅读条）样式且正文有 h2 / h3 时启用。
 *
 * 导航位于 swup 容器之外：每次进入页面时（initPage）重新读取正文标题，
 * 离开页面时（lifecycle 清理）清空并隐藏。
 */
import { $, $$, headerOffset, throttle } from "../core/dom";
import { listen, onCleanup } from "../core/lifecycle";

const HEADINGS = ".joe_detail__article h2, .joe_detail__article h3";

export function initNavChapter(): void {
  const box = $<HTMLElement>(".joe_header--islands .joe_header__chapter");
  if (!box) return;
  const current = $<HTMLButtonElement>(".joe_header__chapter-current", box)!;
  const list = $<HTMLOListElement>(".joe_header__chapter-list", box)!;
  const headings = $$<HTMLElement>(HEADINGS).filter((h) =>
    h.textContent?.trim(),
  );

  const reset = () => {
    box.hidden = true;
    box.classList.remove("is-open");
    current.setAttribute("aria-expanded", "false");
    list.replaceChildren();
  };
  reset();
  onCleanup(reset);
  if (headings.length < 2) return;

  // 迷你目录：h3 缩进一级
  headings.forEach((h, i) => {
    if (!h.id) h.id = `joe-chapter-${i + 1}`;
    const item = document.createElement("li");
    item.className = h.tagName === "H3" ? "sub" : "";
    const link = document.createElement("a");
    link.href = `#${h.id}`;
    link.setAttribute("role", "menuitem");
    link.textContent = h.textContent!.trim();
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(false);
      window.scrollTo({
        top: h.getBoundingClientRect().top + window.scrollY - headerOffset(),
        behavior: "smooth",
      });
    });
    item.appendChild(link);
    list.appendChild(item);
  });
  box.hidden = false;

  const indexEl = $(".index", current)!;
  const nameEl = $(".name", current)!;
  let active = -1;
  const update = () => {
    const line = headerOffset() + 24;
    let index = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i]!.getBoundingClientRect().top <= line) index = i;
      else break;
    }
    if (index === active) return;
    active = index;
    indexEl.textContent = `§${index + 1}/${headings.length}`;
    nameEl.textContent = headings[index]!.textContent!.trim();
    $$("li", list).forEach((li, i) => li.classList.toggle("is-active", i === index));
  };
  update();
  listen(document, "scroll", throttle(update, 80), { passive: true });

  const setOpen = (open: boolean) => {
    box.classList.toggle("is-open", open);
    current.setAttribute("aria-expanded", String(open));
    if (open) $("li.is-active", list)?.scrollIntoView({ block: "nearest" });
  };
  listen(current, "click", (event) => {
    event.stopPropagation();
    setOpen(!box.classList.contains("is-open"));
  });
  listen(document, "click", (event) => {
    if (!box.contains(event.target as Node)) setOpen(false);
  });
  listen(document, "keydown", (event) => {
    if ((event as KeyboardEvent).key === "Escape") setOpen(false);
  });
}
