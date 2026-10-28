/** 文章页入口 */
import { initCodeBlocks } from "../content/code-block";
import { initShortcodes } from "../content/shortcodes";
import { initGallery } from "../content/gallery";
import { initAsideOperate } from "../content/aside-operate";
import {
  ensureHeadingIds,
  initCopyright,
  initLike,
  initProgressBar,
  initShare,
  initSeries,
  initToc,
  initWordCount,
  scrollToHash,
} from "../content/article";

export default function init(): void {
  initShortcodes();
  ensureHeadingIds();
  initWordCount();
  initToc();
  initSeries();
  initLike();
  initAsideOperate();
  initShare();
  initCopyright();
  initProgressBar();
  initGallery();
  // 文章元数据可单独关闭长代码自动折叠
  initCodeBlocks({
    foldLong:
      document.querySelector<HTMLElement>(".joe_detail")?.dataset
        .foldLongCode !== "false",
  });
  scrollToHash();
}
