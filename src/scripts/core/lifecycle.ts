/**
 * 页面生命周期。
 *
 * 开启 swup（无刷新切页）后，页面内容会被替换而不是重新加载，因此所有初始化逻辑都要能「卸载 → 再执行」。
 * 约定：初始化函数通过 `onCleanup()` 登记清理动作（移除事件、清除定时器、断开 Observer、销毁实例），
 * 切页前统一执行。未开启 swup 时这些清理永远不会触发，行为与整页加载一致。
 *
 * 推荐写法：用 `listen()` / `every()` / `observe()` 代替原生 API，自动登记清理。
 */

type Cleanup = () => void;

let cleanups: Cleanup[] = [];

/** 登记一个在离开当前页面时执行的清理函数 */
export function onCleanup(fn: Cleanup): void {
  cleanups.push(fn);
}

/** 执行并清空所有已登记的清理函数（切页前调用） */
export function runCleanups(): void {
  const pending = cleanups;
  cleanups = [];
  for (const fn of pending.reverse()) {
    try {
      fn();
    } catch (error) {
      console.error("[joe-next] 清理失败", error);
    }
  }
}

/** addEventListener，离开页面时自动移除 */
export function listen<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function listen<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function listen<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function listen(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions,
): void {
  target.addEventListener(type, handler, options);
  onCleanup(() => target.removeEventListener(type, handler, options));
}

/** setInterval，离开页面时自动清除 */
export function every(ms: number, fn: () => void): void {
  const id = setInterval(fn, ms);
  onCleanup(() => clearInterval(id));
}

/** setTimeout，离开页面时自动清除 */
export function later(ms: number, fn: () => void): void {
  const id = setTimeout(fn, ms);
  onCleanup(() => clearTimeout(id));
}

/** IntersectionObserver，离开页面时自动断开 */
export function observe(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, options);
  onCleanup(() => observer.disconnect());
  return observer;
}

/** requestAnimationFrame 循环，离开页面时自动停止。回调返回 false 时停止循环 */
export function loop(fn: () => boolean | void): void {
  let id = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    if (fn() === false) return;
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  onCleanup(() => {
    stopped = true;
    cancelAnimationFrame(id);
  });
}
