/** 瞬间长内容的展开与收起；图片、视频、字号和列表宽度变化后重新判断。 */
import { $ } from "../core/dom";
import { listen, onCleanup } from "../core/lifecycle";

export function initMomentContent(item: HTMLElement): void {
  const body = $<HTMLElement>(".joe_journal_body", item);
  const content = $<HTMLElement>(".content-wrp", item);
  const expander = $<HTMLButtonElement>(".journal_content_expander", item);
  if (!body || !content || !expander) return;
  const label = $("span", expander);

  const setOpen = (open: boolean) => {
    body.classList.toggle("open", open);
    expander.setAttribute("aria-expanded", String(open));
    const text = open ? "收起全文" : "展开全文";
    expander.setAttribute("aria-label", text);
    if (label) label.textContent = text;
  };
  const update = () => {
    const limit =
      Number.parseFloat(
        getComputedStyle(body).getPropertyValue("--moment-max-height"),
      ) || 300;
    const overflowing = content.getBoundingClientRect().height > limit + 1;
    body.classList.toggle("is-collapsible", overflowing);
    expander.hidden = !overflowing;
    if (!overflowing) setOpen(false);
  };

  listen(expander, "click", () => setOpen(!body.classList.contains("open")));
  // 媒体加载不会冒泡，在捕获阶段监听；也覆盖没有 ResizeObserver 的浏览器。
  listen(body, "load", update, { capture: true });
  listen(body, "error", update, { capture: true });
  listen(body, "loadedmetadata", update, { capture: true });
  listen(window, "resize", update);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(update);
    observer.observe(content);
    onCleanup(() => observer.disconnect());
  }
  update();
}
