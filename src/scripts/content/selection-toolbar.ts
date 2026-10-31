/**
 * 选中文字工具条：在文章正文里选中一段文字后，选区上方出现一个小工具条。
 *
 * - 复制：复制选中的文字（附带版权信息的逻辑仍由 content/article.ts 的 copy 事件处理）
 * - 引用评论：把选中的文字作为引用块接到评论框末尾（评论组件的编辑器在 Shadow DOM 中），并滚动到评论区
 * - 分享：支持 Web Share 的设备调用系统分享，其余复制「文字 + 文章链接」
 *
 * 禁止复制的文章（.uncopy）、选区很短（< 4 字）或跨出正文时不显示。
 */
import { $ } from "../core/dom";
import { listen, onCleanup } from "../core/lifecycle";
import { copyText } from "../core/clipboard";
import { iconHtml } from "../core/icons";
import { toast } from "../core/toast";
import { escapeHtml } from "../core/html";

const MIN = 4;
const MAX_QUOTE = 300;

/** 在（可能嵌套的）Shadow DOM 中找评论编辑器 */
function findEditor(root: ParentNode | null): HTMLElement | null {
  if (!root) return null;
  for (const node of root.querySelectorAll<HTMLElement>("*")) {
    if (node.getAttribute("contenteditable") === "true") return node;
    if (node.shadowRoot) {
      const found = findEditor(node.shadowRoot);
      if (found) return found;
    }
  }
  return null;
}

/** 编辑器所在 Shadow DOM 的选区（Chrome 支持 shadowRoot.getSelection，其他浏览器用 document 的） */
function selectionOf(editor: HTMLElement): Selection | null {
  const root = editor.getRootNode() as ShadowRoot & { getSelection?: () => Selection | null };
  return root.getSelection?.() ?? document.getSelection();
}

/** 把光标放到 node 的末尾 */
function caretToEnd(sel: Selection, node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function quoteToComment(text: string): boolean {
  const editor = findEditor($(".joe_comment"));
  if (!editor) return false;
  const quote = text.length > MAX_QUOTE ? `${text.slice(0, MAX_QUOTE)}…` : text;
  const html = `<blockquote><p>${escapeHtml(quote).replace(/\n+/g, "</p><p>")}</p></blockquote><p><br></p>`;
  editor.focus();
  const sel = selectionOf(editor);
  // 引用接在已写内容的后面
  if (sel) caretToEnd(sel, editor);
  // CommentNext 的编辑器只在浏览器原生粘贴时写入内容，模拟的 paste 事件不起作用；它自己插入内容用的就是
  // execCommand("insertHTML")，这里同样做，编辑器会照常同步。其他评论组件（CommentWidget）不支持时退回 paste 事件。
  const inserted = document.execCommand("insertHTML", false, html);
  if (!inserted) {
    const data = new DataTransfer();
    data.setData("text/html", html);
    data.setData("text/plain", `> ${quote}\n\n`);
    editor.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }
  // 光标放进引用后面的空行，接着打字就是评论内容而不是写进引用里
  const tail = editor.lastElementChild;
  if (sel && tail && tail.tagName === "P") caretToEnd(sel, tail);
  editor.scrollIntoView({ block: "center", behavior: "smooth" });
  return true;
}

export function initSelectionToolbar(): void {
  const article = $(".joe_detail__article");
  if (!article || article.classList.contains("uncopy")) return;
  const canComment = !!$(".joe_comment halo-comment, .joe_comment comment-widget, .joe_comment [id^='comment-content']");

  const bar = document.createElement("div");
  bar.className = "joe_selbar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "选中文字");
  bar.hidden = true;
  bar.innerHTML = [
    `<button type="button" data-sel="copy">${iconHtml("copy")}<span>复制</span></button>`,
    canComment ? `<button type="button" data-sel="quote">${iconHtml("comment")}<span>引用评论</span></button>` : "",
    `<button type="button" data-sel="share">${iconHtml("share")}<span>分享</span></button>`,
  ].join("");
  document.body.appendChild(bar);

  let text = "";
  const hide = () => {
    bar.hidden = true;
    bar.classList.remove("is-shown");
  };

  const update = () => {
    const sel = document.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    text = sel?.toString().replace(/<已自动折叠>/g, "").trim() ?? "";
    if (!range || sel!.isCollapsed || text.length < MIN || !article.contains(range.commonAncestorContainer)) return hide();
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return hide();
    bar.hidden = false;
    const width = bar.offsetWidth;
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left + rect.width / 2 - width / 2));
    // 选区上方放不下（贴近顶部导航）时放到下方
    const above = rect.top - bar.offsetHeight - 10;
    const top = above > 72 ? above : rect.bottom + 10;
    bar.style.transform = `translate(${Math.round(left)}px, ${Math.round(top + window.scrollY)}px)`;
    requestAnimationFrame(() => bar.classList.add("is-shown"));
  };

  // 鼠标抬起 / 键盘选择结束后再显示，避免拖选过程中闪烁
  listen(document, "mouseup", () => setTimeout(update, 0));
  listen(document, "keyup", (event: KeyboardEvent) => event.shiftKey && update());
  listen(document, "selectionchange", () => {
    if (document.getSelection()?.isCollapsed) hide();
  });
  listen(window, "scroll", hide, { passive: true });
  listen(document, "keydown", (event: KeyboardEvent) => event.key === "Escape" && hide());

  // 点工具条时不要让选区消失
  bar.addEventListener("mousedown", (event) => event.preventDefault());
  bar.addEventListener("click", async (event) => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sel]")?.dataset.sel;
    if (!action || !text) return;
    const title = document.title.split(" - ")[0];
    if (action === "copy") {
      await copyText(text);
    } else if (action === "quote") {
      // 评论组件进入视口后才加载：先滚动过去，等编辑器出现再写入
      if (!quoteToComment(text)) {
        $(".joe_comment")?.scrollIntoView({ block: "start", behavior: "smooth" });
        const quote = text;
        let tries = 0;
        const timer = setInterval(() => {
          if (quoteToComment(quote) || ++tries > 20) {
            clearInterval(timer);
            if (tries > 20) toast("评论区还没准备好，稍后再试", "warning");
          }
        }, 250);
      }
    } else if (action === "share") {
      const url = location.href.split("#")[0]!;
      if (navigator.share) await navigator.share({ title, text: `「${text}」`, url }).catch(() => undefined);
      else await copyText(`「${text}」\n—— ${title} ${url}`, "已复制文字和文章链接");
    }
    // 引用评论时光标已经放进评论框，这里再清选区会把它也清掉
    if (action !== "quote") document.getSelection()?.removeAllRanges();
    hide();
  });

  // 无刷新切页时移除（监听由 listen 登记，切页前统一释放）
  onCleanup(() => bar.remove());
}
