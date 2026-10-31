/**
 * 清理 Halo 自动生成的文章摘要（正文纯文本的前 N 个字符）中的代码：
 * Halo 把 <pre> 的文本也算进摘要，代码会带着换行出现（正文段落之间只有空格）。
 *
 * 只用于自动摘要；手写摘要（spec.excerpt.autoGenerate = false）原样显示。
 */

/** 第一处换行通常就是代码块的开始：之后的内容整体丢弃 */
const CODE_START = /\s*\n[\s\S]*$/;
/** 摘要被截断时可能残留在结尾的代码片段（如 "export function greet(name"） */
const TRAILING_CODE = /\s+(?:export|import|const|let|var|function|class|return|def|public|private|package|<\/?[a-z])[^一-龥]*$/;

export function cleanExcerpt(text: string): string {
  const cleaned = text
    .replace(CODE_START, "")
    .replace(TRAILING_CODE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || text.trim();
}

/** 清理页面中标记为自动摘要（data-joe-excerpt="auto"）的元素，title 同步更新 */
export function cleanExcerpts(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-joe-excerpt="auto"]').forEach((el) => {
    const text = cleanExcerpt(el.textContent ?? "");
    el.textContent = text;
    if (el.title) el.title = text;
    el.removeAttribute("data-joe-excerpt");
  });
}
