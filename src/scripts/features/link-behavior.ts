/**
 * 内容区链接的打开方式（固定规则，不再提供设置）：
 * - 站外链接：新标签打开，并加 rel="noopener noreferrer nofollow"
 * - 站内链接：不改动，由 swup 无刷新切换（core/swup.ts 不接管 target="_blank" 的链接，所以这里不给站内链接加）
 * 作者在编辑器里给站内链接手动设了新标签打开的，保留作者的选择。
 */
import { $$ } from "../core/dom";

const LINKS = ".joe_main_container a[href]";

export function initLinkBehavior(): void {
  for (const link of $$<HTMLAnchorElement>(LINKS)) {
    const href = link.getAttribute("href") ?? "";
    if (!/^https?:\/\//i.test(href) && !href.startsWith("//")) continue;
    let url: URL;
    try {
      url = new URL(href, location.href);
    } catch {
      continue;
    }
    if (url.origin === location.origin) continue;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
  }
}
