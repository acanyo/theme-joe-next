/** 评论组件 DOM 适配；仅使用开放的 Shadow DOM、组件公开属性和分页按钮。 */
import type { CommentAnchor } from "./comment-anchor-core";

export const COMMENT_WIDGETS = "comment-widget, comment-next";

/** 组件可能嵌套多层 Shadow DOM，例如官方组件的 comment-list / comment-item。 */
export function commentRoots(host: HTMLElement): (HTMLElement | ShadowRoot)[] {
  const roots: (HTMLElement | ShadowRoot)[] = [host];
  for (let i = 0; i < roots.length; i++) {
    roots[i]!.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) roots.push(element.shadowRoot);
    });
    if (i === 0 && host.shadowRoot) roots.push(host.shadowRoot);
  }
  return roots;
}

interface OfficialItem extends HTMLElement {
  comment?: { metadata?: { name?: string } };
  reply?: { metadata?: { name?: string } };
}

export function findCommentTarget(
  host: HTMLElement,
  anchor: CommentAnchor,
): HTMLElement | null {
  if (anchor.section) {
    const subjectId = `comment-${[host.getAttribute("group")?.replaceAll(".", "-"), host.getAttribute("kind"), host.getAttribute("name")].filter(Boolean).join("-")}`;
    return anchor.section === subjectId ||
      ["comments", "comment", "halo-comment"].includes(anchor.section)
      ? host
      : null;
  }
  const roots = commentRoots(host);
  const id = anchor.replyName
    ? `comment-next-reply-${anchor.replyName}`
    : `comment-next-comment-${anchor.commentName}`;
  for (const root of roots) {
    const direct = root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
    if (direct) return direct;
    const tag = anchor.replyName ? "reply-item" : "comment-item";
    for (const item of root.querySelectorAll<OfficialItem>(tag)) {
      const name = anchor.replyName
        ? item.reply?.metadata?.name
        : item.comment?.metadata?.name;
      if (name === (anchor.replyName || anchor.commentName)) return item;
    }
  }
  return null;
}

export function isOfficialWidget(host: HTMLElement): boolean {
  return commentRoots(host).some(
    (root) =>
      !!root.querySelector("comment-form, comment-list, comment-detail"),
  );
}

export function revealCommentWidget(host: HTMLElement): void {
  // 瞬间评论默认收起；先展开容器，组件原生的可见性监听才能继续定位。
  host.closest(".footer-wrap")?.classList.add("open");
}

/** 老版 Comment Next 没有按固定链接读取单条讨论的 API，使用其分页入口找到对应评论。 */
export function advanceCommentNext(
  host: HTMLElement,
  anchor: CommentAnchor,
  visited: Set<string>,
): void {
  const roots = commentRoots(host);
  if (anchor.commentName && anchor.replyName) {
    const parentId = `comment-next-comment-${anchor.commentName}`;
    for (const root of roots) {
      const parent = root.querySelector<HTMLElement>(
        `[id="${CSS.escape(parentId)}"]`,
      );
      if (!parent) continue;
      const more = parent.querySelector<HTMLButtonElement>(
        ".comment-next-replies-message button",
      );
      const key = `reply:${parent.querySelectorAll('[id^="comment-next-reply-"]').length}`;
      if (
        more &&
        more.textContent?.trim().startsWith("展开剩余") &&
        !more.disabled &&
        !visited.has(key)
      ) {
        visited.add(key);
        more.click();
      }
      return;
    }
  }
  for (const root of roots) {
    const pages = root.querySelector(".comment-next-comments-page-list");
    if (!pages) continue;
    const current =
      pages.querySelector('[aria-current="page"]')?.textContent?.trim() || "1";
    if (visited.has(`page:${current}`) || visited.size >= 24) return;
    const first = Array.from(
      pages.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "1");
    if (!visited.size && current !== "1" && first && !first.disabled) {
      visited.add("reset");
      first.click();
      return;
    }
    const next = Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        ".comment-next-comments-page-control",
      ),
    ).at(-1);
    if (next && !next.disabled) {
      visited.add(`page:${current}`);
      next.click();
    }
    return;
  }
}
