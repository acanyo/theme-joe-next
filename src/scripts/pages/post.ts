/** 文章页入口 */
import { initPoster } from "../content/poster";
import { initGallery } from "../content/gallery";
import { initAsideOperate } from "../content/aside-operate";
import { recordReading } from "../features/visitor";
import { initCommentEnhancements } from "../features/comment-greeting";
import {
  ensureHeadingIds,
  initCopyright,
  initLike,
  initProgressBar,
  initShare, initDonate,
  initToc,
  initWordCount,
  scrollToHash,
} from "../content/article";

export default function init(): void {
  ensureHeadingIds();
  initWordCount();
  initToc();
  recordReading();
  initCommentEnhancements();
  initLike();
  initAsideOperate();
  initShare();
  initDonate();
  initPoster();
  initCopyright();
  initProgressBar();
  initGallery();
  scrollToHash();
}
