/**
 * 「渲染原始内容」的文章（文章元数据 use_raw_content）：模板把正文 HTML 以转义文本输出到
 * `.joe_raw_content`，这里解析后放进 Shadow DOM，文章自带的样式与脚本不会影响主题页面。
 *
 * Shadow DOM 中的标题对 tocbot 不可见，目录由 buildRawToc() 单独生成：同样的列表结构与类名，
 * 点击平滑滚动，滚动时高亮当前标题。
 */
import { $ } from "../core/dom";
import { listen } from "../core/lifecycle";

/** 渲染原始内容，返回 shadow root；页面不是原始内容时返回 null */
export function renderRawContent(): ShadowRoot | null {
  const host = $<HTMLElement>(".joe_raw_content");
  if (!host) return null;
  if (host.shadowRoot) return host.shadowRoot;
  const html = host.textContent ?? "";
  host.textContent = "";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = html;
  return root;
}

interface Heading {
  el: HTMLElement;
  level: number;
}

/** 生成原始内容的目录。depth：collapseDepth 之外的层级默认收起（与 tocbot 一致，0 = 只展开一级） */
export function buildRawToc(
  root: ShadowRoot,
  container: HTMLElement,
  options: { offset: number; onNavigate?: () => void },
): void {
  const headings: Heading[] = [...root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")].map(
    (el, i) => {
      if (!el.id) el.id = `raw-heading-${i}`;
      return { el, level: Number(el.tagName[1]) };
    },
  );
  if (!headings.length) {
    container.innerHTML = '<div class="toc-nodata">暂无目录</div>';
    return;
  }

  // 按层级嵌套：<ol class="toc-list"><li class="toc-list-item"><a class="toc-link">…</a><ol>…</ol></li></ol>
  const top = document.createElement("ol");
  top.className = "toc-list";
  const stack: { level: number; list: HTMLOListElement }[] = [{ level: 0, list: top }];
  const links = new Map<HTMLElement, HTMLAnchorElement>();
  for (const h of headings) {
    while (stack.length > 1 && stack.at(-1)!.level >= h.level) stack.pop();
    const item = document.createElement("li");
    item.className = "toc-list-item";
    const link = document.createElement("a");
    link.className = `toc-link node-name--${h.el.tagName}`;
    link.href = `#${h.el.id}`;
    link.textContent = h.el.textContent?.trim() ?? "";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      options.onNavigate?.();
      // 关闭抽屉恢复滚动位置后再滚动到标题
      requestAnimationFrame(() =>
        window.scrollTo({
          top: h.el.getBoundingClientRect().top + window.scrollY - options.offset,
          behavior: "smooth",
        }),
      );
    });
    item.appendChild(link);
    stack.at(-1)!.list.appendChild(item);
    const sub = document.createElement("ol");
    sub.className = "toc-list";
    item.appendChild(sub);
    stack.push({ level: h.level, list: sub });
    links.set(h.el, link);
  }
  top.querySelectorAll("ol:empty").forEach((ol) => ol.remove());
  container.replaceChildren(top);

  const update = () => {
    let current = headings[0]!;
    for (const h of headings) if (h.el.getBoundingClientRect().top <= options.offset + 10) current = h;
    for (const [el, link] of links) link.classList.toggle("is-active-link", el === current.el);
  };
  update();
  listen(document, "scroll", () => requestAnimationFrame(update), { passive: true });
}
