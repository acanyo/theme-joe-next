/**
 * 全站公共脚本入口，由 BaseLayout 引入。页面专属逻辑在 src/scripts/pages/ 中按页加载。
 */
import { onIdle, onReady } from "./core/dom";
import { initActions } from "./features/actions";
import { initAsideWidgets } from "./features/aside-widgets";
import { initColorMode } from "./features/color-mode";
import { initEnhancements } from "./features/enhancements";
import { initFooter } from "./features/footer";
import { initImageFallback } from "./features/image-fallback";
import { initLinkBehavior } from "./features/link-behavior";
import { finishLoadingBar, startLoadingBar } from "./features/loading-bar";
import { initNavigation } from "./features/navigation";
import { initReveal } from "./features/reveal";

initImageFallback();

onReady(() => {
  startLoadingBar();
  initColorMode();
  initNavigation();
  initActions();
  initFooter();
  initLinkBehavior();
  initReveal();
  initAsideWidgets();
});

onIdle(() => {
  finishLoadingBar();
  initEnhancements();
});
