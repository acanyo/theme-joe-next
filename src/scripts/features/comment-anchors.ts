/** 评论固定链接：首屏、同页点击与 Swup 切页均等待评论异步加载后定位。 */
import { headerOffset } from "../core/dom";
import { onCleanup } from "../core/lifecycle";
import { officialCommentHash, parseCommentAnchor } from "./comment-anchor-core";
import {
  advanceCommentNext,
  COMMENT_WIDGETS,
  findCommentTarget,
  isOfficialWidget,
  revealCommentWidget,
} from "./comment-anchor-widgets";

interface Subject {
  group?: string;
  kind?: string;
  name?: string;
}

let cancelPending = () => {};
let installed = false;

function locateComment(): void {
  cancelPending();
  const anchor = parseCommentAnchor(location.hash);
  if (!anchor) return;
  const originalUrl = location.href;
  const controller = new AbortController();
  const started = Date.now();
  const visited = new Set<string>();
  let subject: Subject | undefined;
  let fetchedSubject = false;
  let fallbackShown = false;
  let timer = 0;
  let frame = 0;
  let stopped = false;

  const cancel = () => {
    stopped = true;
    controller.abort();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
  cancelPending = cancel;
  const scrollTo = (target: HTMLElement) => {
    frame = requestAnimationFrame(() => {
      if (stopped || !target.isConnected || location.href !== originalUrl)
        return;
      target.style.scrollMarginTop = `${headerOffset()}px`;
      window.scrollTo({
        top:
          target.getBoundingClientRect().top + window.scrollY - headerOffset(),
        behavior: "instant",
      });
    });
  };
  const matches = (host: HTMLElement) =>
    subject &&
    ["group", "kind", "name"].every(
      (key) =>
        (host.getAttribute(key) || "") ===
        (subject?.[key as keyof Subject] || ""),
    );

  const check = () => {
    if (
      stopped ||
      location.href !== originalUrl ||
      Date.now() - started > 15000
    ) {
      cancel();
      return;
    }
    const widgets = Array.from(
      document.querySelectorAll<HTMLElement>(COMMENT_WIDGETS),
    );
    const nativeHost =
      widgets.find(matches) || (widgets.length === 1 ? widgets[0] : undefined);
    // 先转换链接，避免官方组件在 hashchange 后切换列表时把刚找到的旧节点卸载。
    if (anchor.native && nativeHost && isOfficialWidget(nativeHost)) {
      const hash = officialCommentHash(anchor);
      if (hash) {
        const url = new URL(location.href);
        url.hash = hash;
        history.replaceState(history.state, "", url);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        return;
      }
    }
    for (const widget of widgets) {
      const target = findCommentTarget(widget, anchor);
      if (!target) continue;
      revealCommentWidget(widget);
      if (!target.getClientRects().length) continue;
      // 先结束等待，再滚动；保留 cancel 以便切页时撤销待执行的动画帧。
      clearTimeout(timer);
      controller.abort();
      scrollTo(target);
      return;
    }
    const host =
      widgets.find(matches) ||
      (anchor.section && widgets.length === 1 ? widgets[0] : undefined);
    if (host) {
      revealCommentWidget(host);
      if (!fallbackShown) {
        fallbackShown = true;
        scrollTo(host);
      }
      if (subject) advanceCommentNext(host, anchor, visited);
    }
    if (!fetchedSubject && anchor.commentName) {
      fetchedSubject = true;
      void fetch(
        `/apis/api.halo.run/v1alpha1/comments/${encodeURIComponent(anchor.commentName)}`,
        {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          if (!response.ok) return;
          const comment = (await response.json()) as {
            spec?: { subjectRef?: Subject };
          };
          if (!stopped) subject = comment.spec?.subjectRef;
        })
        .catch(() => {});
    }
    timer = window.setTimeout(check, 150);
  };
  // 让组件自己的 hashchange 处理与渲染微任务先结束，再查找目标节点。
  timer = window.setTimeout(check, 0);
}

function onCommentLink(event: MouseEvent): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  )
    return;
  const link = event
    .composedPath()
    .find(
      (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
    );
  if (
    !link ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  )
    return;
  const url = new URL(link.href, location.href);
  if (
    url.origin !== location.origin ||
    url.pathname !== location.pathname ||
    url.search !== location.search ||
    !parseCommentAnchor(url.hash)
  )
    return;
  event.preventDefault();
  // 原生 hash 导航会通知两种组件；重复点同一条链接也重新执行定位。
  if (url.hash === location.hash) locateComment();
  else location.hash = url.hash;
}

export function initCommentAnchors(): void {
  if (installed) return;
  installed = true;
  // 等组件自己的复制链接等事件先执行，避免把已经处理的点击改成页面跳转。
  document.addEventListener("click", onCommentLink);
  window.addEventListener("hashchange", locateComment);
  window.addEventListener("popstate", locateComment);
  window.addEventListener("wheel", () => cancelPending(), { passive: true });
  window.addEventListener("touchstart", () => cancelPending(), {
    passive: true,
  });
}

/** Swup 的 pushState 不触发 hashchange，评论组件必须在内容和页面脚本就绪后收到通知。 */
export function refreshCommentAnchors(): void {
  onCleanup(() => cancelPending());
  notifyCommentAnchor();
}

/** 同页锚点由 Swup 更新 history 后也需要通知组件。 */
export function notifyCommentAnchor(): void {
  if (parseCommentAnchor(location.hash))
    window.dispatchEvent(new HashChangeEvent("hashchange"));
}
