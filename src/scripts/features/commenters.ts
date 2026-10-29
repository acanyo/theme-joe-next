/**
 * 文章卡片的评论者头像（components/list/PostItem.astro，设置 home.card_commenters）：
 * 同一人多次评论只留一个头像，最多显示 4 个。
 */
import { $$ } from "../core/dom";

const MAX = 4;

export function dedupeCommenters(root: ParentNode = document): void {
  $$<HTMLElement>(".joe_list__item .commenters", root).forEach((box) => {
    const seen = new Set<string>();
    $$<HTMLImageElement>("img", box).forEach((img) => {
      const key = img.dataset.name || img.src;
      if (seen.has(key) || seen.size >= MAX) img.remove();
      else seen.add(key);
    });
  });
}
