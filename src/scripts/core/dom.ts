/** 通用 DOM 工具，替代原 jQuery 用法 */

export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null => root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] => Array.from(root.querySelectorAll<T>(selector));

export const isMobile = (): boolean =>
  /windows phone|iphone|android/i.test(navigator.userAgent);

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait = 120,
): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = undefined;
        fn(...args);
      }, remaining);
    }
  };
}

/** 平滑滚动到页面指定位置 */
export function scrollToTop(top: number, smooth = true): void {
  window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
}

/** 已固定头部高度，用于锚点定位时的偏移 */
export function headerOffset(): number {
  return ($(".joe_header__above")?.offsetHeight ?? 0) + 15;
}

export function onReady(fn: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

/** 页面完全加载后执行（低优先级任务，如特效） */
export function onIdle(fn: () => void): void {
  const run = () =>
    "requestIdleCallback" in window
      ? requestIdleCallback(() => fn())
      : setTimeout(fn, 200);
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}
