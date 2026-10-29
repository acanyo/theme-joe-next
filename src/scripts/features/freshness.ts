/**
 * 文章卡片的新鲜度标记（components/list/PostItem.astro，设置 home.freshness_badge）：
 * 访客读过的文章不再标「新」；「已更新」只有在修改之后读过才去掉。
 * 阅读记录来自 features/visitor.ts，只保存在访客的浏览器里。
 */
import { $$ } from "../core/dom";
import { readHistory } from "./visitor";
import { isBadgeSeen } from "./freshness-rule";

export function hideReadBadges(root: ParentNode = document): void {
  const badges = $$<HTMLElement>(".badge--new, .badge--updated", root);
  if (!badges.length) return;
  const lastRead = new Map(readHistory().map((h) => [h.href, h.last]));
  if (!lastRead.size) return;
  badges.forEach((badge) => {
    const link = badge.closest(".joe_list__item")?.querySelector<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const kind = badge.classList.contains("badge--new") ? "new" : "updated";
    if (isBadgeSeen(kind, lastRead.get(new URL(link.href, location.href).pathname), Number(badge.dataset.edited)))
      badge.remove();
  });
}
