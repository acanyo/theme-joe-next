/** 短代码解析的纯函数（无 DOM 依赖，便于单元测试） */

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

/** 解析 `{name attrs}content{/name}` 形式的子项 */
export function parseItems(
  html: string,
  name: string,
): { attrs: Record<string, string>; content: string }[] {
  const items: { attrs: Record<string, string>; content: string }[] = [];
  const pattern = new RegExp(`{${name}([^}]*)}([\\s\\S]*?){\\/${name}}`, "g");
  for (const match of html.matchAll(pattern)) {
    const attrs: Record<string, string> = {};
    for (const [, key, value] of (match[1] ?? "").matchAll(
      /([\w-]+)="([^"]*)"/g,
    ))
      attrs[key as string] = value as string;
    items.push({
      attrs,
      content: (match[2] ?? "").trim().replace(/^(<br>)|(<br>)$/g, ""),
    });
  }
  return items;
}

/** 只允许 http(s)、mailto、站内相对地址和锚点，拦截 javascript: 等危险协议 */
export function safeUrl(value: string, fallback = "#"): string {
  const url = value.trim();
  if (!url) return fallback;
  if (/^(https?:|mailto:|\/|\.|#|\?)/i.test(url)) return escapeHtml(url);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return escapeHtml(url);
  return fallback;
}
