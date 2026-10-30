/** 友链页：分组与链接排序、申请友链弹窗 */
import { initLinkSort } from "../features/link-sort";
import { initLinkApply } from "../features/link-apply";
import { initCommentEnhancements } from "../features/comment-greeting";

export default function init(): void {
  initLinkSort();
  initLinkApply();
  initCommentEnhancements();
}
