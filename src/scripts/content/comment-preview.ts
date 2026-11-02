/** 评论摘要：只保留文字与表情图片，附件显示占位，不直接插入评论 HTML。 */

const OMIT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
  "TEMPLATE",
  "NOSCRIPT",
]);
const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "BR",
  "BLOCKQUOTE",
  "PRE",
  "LI",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);
const IMAGE_FILENAME = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

type Part = string | HTMLImageElement;

function imagePart(source: Element): Part {
  const alt = source.getAttribute("alt")?.trim() ?? "";
  const isAttachment =
    source.getAttribute("title")?.startsWith("comment-next-image:") ||
    source.classList.contains("comment-next-image") ||
    source.classList.contains("comment-next-editor-image") ||
    IMAGE_FILENAME.test(alt);
  if (isAttachment) return "[图片]";

  const value = source.getAttribute("src")?.trim();
  if (!value) return alt || "[表情]";
  let src: URL;
  try {
    src = new URL(value, document.baseURI);
    if (src.protocol !== "http:" && src.protocol !== "https:")
      return alt || "[表情]";
  } catch {
    return alt || "[表情]";
  }

  const image = document.createElement("img");
  image.className = "joe-comment-preview__emote";
  image.src = src.href;
  image.alt = alt || "表情";
  image.width = 20;
  image.height = 20;
  image.loading = "lazy";
  image.decoding = "async";
  image.dataset.fallback = "text";
  return image;
}

/** 使用惰性 template 解析，只创建新的文本和 img 节点，丢弃输入中的属性与可执行元素。 */
export function commentPreview(html: string, max = 120): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  const parts: Part[] = [];
  const text = (value: string) => {
    const normalized = value.replace(/\s+/g, " ");
    const last = parts.at(-1);
    if (typeof last === "string")
      parts[parts.length - 1] = (last + normalized).replace(/\s+/g, " ");
    else parts.push(normalized);
  };
  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      text(node.textContent ?? "");
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.tagName.toUpperCase();
    if (OMIT_TAGS.has(tag)) return;
    if (tag === "IMG") {
      const part = imagePart(node);
      if (typeof part === "string") text(part);
      else parts.push(part);
      return;
    }
    const block = BLOCK_TAGS.has(tag);
    if (block) text(" ");
    node.childNodes.forEach(visit);
    if (block) text(" ");
  };
  template.content.childNodes.forEach(visit);
  if (typeof parts[0] === "string") parts[0] = parts[0].trimStart();
  const last = parts.at(-1);
  if (typeof last === "string") parts[parts.length - 1] = last.trimEnd();

  const length = parts.reduce(
    (total, part) =>
      total + (typeof part === "string" ? Array.from(part).length : 1),
    0,
  );
  const limit = Math.max(1, max);
  const truncated = length > limit;
  let remaining = truncated ? limit - 1 : limit;
  const fragment = document.createDocumentFragment();
  for (const part of parts) {
    if (!remaining) break;
    if (typeof part === "string") {
      const chars = Array.from(part).slice(0, remaining);
      fragment.append(document.createTextNode(chars.join("")));
      remaining -= chars.length;
    } else {
      fragment.append(part);
      remaining -= 1;
    }
  }
  if (truncated) fragment.append(document.createTextNode("…"));
  return fragment;
}

/** 首次进入和无刷新切页时调用；处理后移除原始内容，重复调用不会重新加载表情。 */
export function renderCommentPreviews(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>("[data-comment-preview]")
    .forEach((element) => {
      element.replaceChildren(
        commentPreview(element.dataset.commentPreview ?? ""),
      );
      element.removeAttribute("data-comment-preview");
    });
}
