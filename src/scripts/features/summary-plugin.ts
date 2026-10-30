/**
 * 智阅 GPT 插件（summaraidGPT）的文章摘要框换成主题风格。
 *
 * 插件在正文开头插入 <likcc-article-summary>，内容渲染在开放的 Shadow DOM 里，主题样式表进不去；
 * 它的配色变量又定义在内部元素上，从外面设置会被覆盖。这里在摘要框出现时往它的 shadowRoot
 * 追加一张样式表（adoptedStyleSheets），用主题的颜色和卡片变量重写简洁 / 行内两种样式。
 * 主题变量（--theme、--bg-page 等）会继承进 Shadow DOM，明暗切换时自动跟着变。
 * 外层间距写在 styles/content/article.css。
 */

const TAG = "likcc-article-summary";

/** 选择器重复一次类名提高权重，压过插件自己的 .likcc-summaraidGPT-fixed / --dark */
const CSS = `
.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed {
  --likcc-summaraid-fixed-accent: var(--theme-text, #4a90e2);
  --likcc-summaraid-fixed-accent-soft: color-mix(in srgb, var(--theme, #4a90e2) 12%, transparent);
  --likcc-summaraid-fixed-accent-faint: color-mix(in srgb, var(--theme, #4a90e2) 5%, transparent);
  --likcc-summaraid-fixed-line: color-mix(in srgb, var(--theme, #4a90e2) 20%, transparent);
  --likcc-summaraid-fixed-text: var(--text-regular, #474c54);
  --likcc-summaraid-fixed-muted: var(--text-secondary, #8a8f99);
  --likcc-summaraid-fixed-surface: color-mix(in srgb, var(--theme, #4a90e2) 6%, var(--bg-page, #fff));
  margin: 0;
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed .likcc-summaraidGPT-simple-shell {
  padding: 14px 16px 15px;
  border-radius: var(--radius-wrap, 6px);
  border-color: var(--likcc-summaraid-fixed-line);
  box-shadow: none;
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed .likcc-summaraidGPT-simple-header {
  gap: 6px;
  margin-bottom: 8px;
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed :is(.likcc-summaraidGPT-simple-title, .likcc-summaraidGPT-inline-title) {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed :is(.likcc-summaraidGPT-simple-icon, .likcc-summaraidGPT-inline-icon) {
  width: 15px;
  height: 15px;
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed :is(.likcc-summaraidGPT-simple-content, .likcc-summaraidGPT-inline-content) {
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--likcc-summaraid-fixed-text);
}

.likcc-summaraidGPT-fixed.likcc-summaraidGPT-fixed .likcc-summaraidGPT-cursor {
  background: var(--theme, #4a90e2);
}
`;

let sheet: CSSStyleSheet | null = null;

function themeSheet(): CSSStyleSheet | null {
  if (sheet) return sheet;
  try {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
  } catch {
    sheet = null;
  }
  return sheet;
}

function restyle(el: Element): void {
  const root = el.shadowRoot;
  const css = themeSheet();
  if (!root || !css || root.adoptedStyleSheets.includes(css)) return;
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, css];
}

function restyleWithin(node: ParentNode): void {
  if (node instanceof Element && node.localName === TAG) restyle(node);
  node.querySelectorAll?.(TAG).forEach(restyle);
}

/**
 * 应用启动时调用一次（scripts/app.ts）。插件在加载完配置后才把占位元素换成摘要框，
 * 无刷新切页时也会重新插入，所以一直监听新加入的摘要框。
 */
export function initSummaryPlugin(): void {
  restyleWithin(document);
  new MutationObserver((records) => {
    for (const record of records)
      for (const node of record.addedNodes) if (node instanceof Element) restyleWithin(node);
  }).observe(document.body, { childList: true, subtree: true });
}
