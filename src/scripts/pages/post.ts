/** 文章页入口 */
import { onIdle, onReady } from "../core/dom";
import { initCodeBlocks } from "../content/code-block";
import { initShortcodes } from "../content/shortcodes";
import { initGallery } from "../content/gallery";
import { initWaline, initWalineCount } from "../content/waline";
import {
  ensureHeadingIds,
  initCopyright,
  initLike,
  initProgressBar,
  initShare,
  initToc,
  initWordCount,
  scrollToHash,
} from "../content/article";

onReady(() => {
  initShortcodes();
  ensureHeadingIds();
  initWordCount();
  initToc();
  initLike();
  initShare();
  initCopyright();
  initProgressBar();
  initGallery();
  void initCodeBlocks();
  scrollToHash();
});

onIdle(() => {
  void initWaline();
  void initWalineCount();
});
