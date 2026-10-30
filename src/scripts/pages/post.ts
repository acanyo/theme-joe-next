/** 文章页入口 */
import { initPoster } from "../content/poster";
import { initCodeBlocks } from "../content/code-block";
import { initShortcodes } from "../content/shortcodes";
import { initGallery } from "../content/gallery";
import { initAsideOperate } from "../content/aside-operate";
import { recordReading } from "../features/visitor";
import { initCommentEnhancements } from "../features/comment-greeting";
import { initSelectionToolbar } from "../content/selection-toolbar";
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
  initShortcodes();
  ensureHeadingIds();
  initWordCount();
  initToc();
  recordReading();
  initCommentEnhancements();
  initSelectionToolbar();
  initLike();
  initAsideOperate();
  initShare();
  initDonate();
  initPoster();
  initCopyright();
  initProgressBar();
  initGallery();
  initCodeBlocks();
  scrollToHash();
}
