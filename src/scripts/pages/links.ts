/** 友链页：分组与链接排序 */
import { initLinkSort } from "../features/link-sort";
import { initCommentEnhancements } from "../features/comment-greeting";

export default function init(): void {
  initLinkSort();
  initCommentEnhancements();
}
