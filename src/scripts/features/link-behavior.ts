/** 内容区链接打开方式（对应设置 theme.link_behavior） */
import { $$ } from "../core/dom";
import { getThemeConfig } from "../core/config";

const CONTENT_LINKS = ".joe_detail__article a[href], .joe_journal_body a[href]";
const ALL_LINKS = ".joe_main_container a[href]";

export function initLinkBehavior(): void {
  const behavior = getThemeConfig().linkBehavior;
  const links = $$<HTMLAnchorElement>(
    behavior === "default" ? CONTENT_LINKS : ALL_LINKS,
  );
  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("javascript:") || href.startsWith("#")) continue;
    const openInNew = behavior === "default" || behavior === "new";
    if (openInNew) link.target = "_blank";
    else link.removeAttribute("target");
    link.rel = "noopener noreferrer nofollow";
  }
}
