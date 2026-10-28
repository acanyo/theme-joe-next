/**
 * 首页瞬间叠放卡片：从 <template> 中的瞬间 HTML 取出纯文本写入卡片（图片、链接等不在卡片里显示），
 * 并在纯文本为空时（只有图片的瞬间）显示占位文字。
 * 展开 / 收起完全由 CSS 处理（:hover、:focus-within）。
 */
import { $$ } from "../core/dom";

const MAX = 80;

export function initMomentsStack(): void {
  for (const el of $$<HTMLElement>(".joe_moments_stack__list .text")) {
    const source = el.nextElementSibling;
    if (!(source instanceof HTMLTemplateElement)) continue;
    const text = (source.content.textContent ?? "").replace(/\s+/g, " ").trim();
    el.textContent =
      text.length > MAX ? `${text.slice(0, MAX)}…` : text || "分享了图片";
  }
}
