/**
 * 全站脚本入口，由 BaseLayout 引入。
 *
 * 分两类初始化：
 * - 外壳（initShell）：导航、页脚、明暗模式、全局监听等，整个会话只执行一次。
 * - 页面（initPage）：作用于 #swup 内容区的逻辑与当前页面脚本，首次加载及每次无刷新切页后执行；
 *   通过 core/lifecycle 登记清理，切页前统一释放。
 */
import { onIdle, onReady } from "./core/dom";
import { getThemeConfig } from "./core/config";
import { runPageScript } from "./core/page-scripts";
import { initActions } from "./features/actions";
import { initAsideWidgets } from "./features/aside-widgets";
import { initAsideDock } from "./features/aside-dock";
import { initColorMode } from "./features/color-mode";
import { initEnhancements } from "./features/enhancements";
import { initFooter } from "./features/footer";
import { initImageFallback } from "./features/image-fallback";
import { initLinkBehavior } from "./features/link-behavior";
import { finishLoadingBar, startLoadingBar } from "./features/loading-bar";
import { initNavigation, refreshNavigation } from "./features/navigation";
import { initMotion } from "./features/motion";

function initShell(): void {
  initColorMode();
  initNavigation();
  initFooter();
}

async function initPage(): Promise<void> {
  refreshNavigation();
  initActions();
  initLinkBehavior();
  initMotion();
  initAsideWidgets();
  initAsideDock();
  await runPageScript();
}

initImageFallback();

onReady(() => {
  startLoadingBar();
  initShell();
  void initPage();

  if (getThemeConfig().pageTransition === "swup") {
    void import("./core/swup").then(({ initSwup }) =>
      initSwup({ preload: getThemeConfig().swupPreload, onPageView: initPage }),
    );
  }
});

onIdle(() => {
  finishLoadingBar();
  initEnhancements();
});
