/**
 * 低优先级的可选增强：鼠标/背景特效、离屏标题、调试面板、控制台信息。
 * 全部按需动态加载，未开启时不会产生任何下载。
 */
import { isMobile } from "../core/dom";
import { getThemeConfig } from "../core/config";

type EffectModule = { default: () => void };

const cursorEffects = import.meta.glob<EffectModule>(
  "../effects/cursor/*.{js,ts}",
);
const backdropEffects = import.meta.glob<EffectModule>(
  "../effects/backdrop/*.js",
);

async function runEffect(
  registry: Record<string, () => Promise<EffectModule>>,
  dir: string,
  name: string,
): Promise<void> {
  const loader =
    registry[`../effects/${dir}/${name}.js`] ??
    registry[`../effects/${dir}/${name}.ts`];
  if (!loader) {
    console.warn(`[joe-next] 未找到特效：${dir}/${name}`);
    return;
  }
  (await loader()).default();
}

function initEffects(): void {
  const config = getThemeConfig();
  if (isMobile() || config.enableCleanMode) return;
  if (config.cursorEffect !== "off")
    void runEffect(cursorEffects, "cursor", config.cursorEffect);
  if (config.backdrop !== "off")
    void runEffect(backdropEffects, "backdrop", config.backdrop);
}

function initOffscreenTitle(): void {
  const config = getThemeConfig();
  if (isMobile() || !config.enableOffscreenTip) return;
  // 只绑定一次，切页后读取当时的路径与标题（无刷新切页时页面会变化）
  let original = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener("visibilitychange", () => {
    if (location.pathname !== "/") return;
    clearTimeout(timer);
    if (document.hidden) {
      original = document.title;
      document.title = config.offscreenTitleLeave || "歪，你去哪里了？";
    } else {
      document.title = config.offscreenTitleBack || "(つェ⊂)咦，又回来了!";
      timer = setTimeout(() => (document.title = original), 2000);
    }
  });
}

async function initDebug(): Promise<void> {
  if (!getThemeConfig().enableDebug) return;
  const { default: VConsole } = await import("vconsole");
  new VConsole();
}

function printConsoleInfo(): void {
  const config = getThemeConfig();
  if (config.enableConsoleTheme) {
    console.log(
      `%cTheme Joe Next v${config.version} · based on Joe3 by Jiewen`,
      "padding:8px 15px;color:#fff;background:linear-gradient(270deg,#986fee,#8695e6,#68b7dd,#18d7d3);border-radius:0 15px 0 15px;",
    );
  }
  if (config.showLoadedTime && !isMobile()) {
    console.log(
      `%c页面加载耗时：${Math.round(performance.now())} ms`,
      "padding:6px 8px;color:#fff;background:linear-gradient(270deg,#4edb21,#f15206);border-radius:3px;",
    );
  }
}

export function initEnhancements(): void {
  initEffects();
  initOffscreenTitle();
  void initDebug();
  printConsoleInfo();
}
