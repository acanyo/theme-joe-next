/** 首页与侧栏共用的评论者资料卡；鼠标悬停、键盘聚焦和触屏点击均可打开。 */
import { listen, onCleanup } from "../core/lifecycle";
import { escapeHtml } from "../core/html";
import { relativeTime } from "../core/time";
import { commenterWebsite, type CommenterData } from "./commenters-core";
import { fillEmptyImages } from "./image-fallback";

const TRIGGER = ".joe_commenter_trigger";

function cardHtml(trigger: HTMLElement): string {
  const data = trigger.dataset;
  const image = trigger.querySelector("img");
  const commenter: CommenterData = {
    name: data.name || image?.alt || "访客",
    avatar: image?.currentSrc || image?.getAttribute("src") || "",
    kind: data.kind || "Email",
    site: data.kind === "Email" ? commenterWebsite(data.site) : undefined,
    text: data.text?.trim(),
    time: data.time,
  };
  const badge = commenter.kind === "User" ? "站内用户" : "访客";
  const site = commenter.site
    ? `<a class="site" href="${escapeHtml(commenter.site)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(new URL(commenter.site).host)}</a>`
    : "";
  const time = new Date(commenter.time || "");
  return `<button type="button" class="close" data-commenter-close aria-label="关闭评论者资料">×</button>
    <div class="head">
      <img src="${escapeHtml(commenter.avatar)}" alt="${escapeHtml(commenter.name)}" width="40" height="40" data-fallback="avatar" data-text-avatar="${escapeHtml(commenter.name)}" />
      <div class="who"><strong>${escapeHtml(commenter.name)}</strong><span class="tag${commenter.kind === "User" ? " tag--user" : ""}">${badge}</span></div>
    </div>
    ${site}
    ${commenter.text ? `<p class="quote">${escapeHtml(commenter.text)}</p>` : ""}
    ${Number.isNaN(time.getTime()) ? "" : `<time datetime="${time.toISOString()}">${relativeTime(time)}评论</time>`}`;
}

export function initCommenterCards(): void {
  // 列表头像可能稍后才异步插入，保留事件委托。
  if (!document.querySelector(`${TRIGGER}, .commenters[data-post]`)) return;
  const card = document.createElement("div");
  card.id = "joe-commenter-card";
  card.className = "joe_commenter_card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "评论者资料");
  card.hidden = true;
  document.body.appendChild(card);

  let current: HTMLElement | null = null;
  let pinned = false;
  let restoringFocus = false;
  let hideTimer = 0;
  let frame = 0;

  const place = (trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    const width = card.offsetWidth,
      height = card.offsetHeight;
    const above = rect.top - height - 10;
    const top = above > 64 ? above : rect.bottom + 10;
    const left = Math.max(
      8,
      Math.min(
        window.innerWidth - width - 8,
        rect.left + rect.width / 2 - width / 2,
      ),
    );
    card.style.transform = `translate(${Math.round(left)}px, ${Math.round(Math.max(8, Math.min(top, window.innerHeight - height - 8)))}px)`;
    card.dataset.side = above > 64 ? "top" : "bottom";
  };

  const hide = (restoreFocus = false) => {
    clearTimeout(hideTimer);
    cancelAnimationFrame(frame);
    const previous = current;
    current?.setAttribute("aria-expanded", "false");
    current?.removeAttribute("aria-controls");
    current = null;
    pinned = false;
    card.hidden = true;
    card.classList.remove("is-shown");
    if (restoreFocus && previous?.isConnected) {
      restoringFocus = true;
      previous.focus({ preventScroll: true });
      restoringFocus = false;
    }
  };

  const show = (trigger: HTMLElement, pin = false) => {
    clearTimeout(hideTimer);
    if (current !== trigger || card.hidden) {
      current?.setAttribute("aria-expanded", "false");
      current?.removeAttribute("aria-controls");
      current = trigger;
      card.innerHTML = cardHtml(trigger);
      fillEmptyImages(card);
      card.hidden = false;
      card.classList.remove("is-shown");
      place(trigger);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => card.classList.add("is-shown"));
    }
    pinned = pin;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", card.id);
  };

  const laterHide = () => {
    if (pinned) return;
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => hide(), 160);
  };
  const target = (event: Event) =>
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(TRIGGER)
      : null;
  const within = (node: EventTarget | null) =>
    node instanceof Node && (card.contains(node) || !!current?.contains(node));

  listen(document, "pointerover", (event) => {
    const trigger = target(event);
    if (trigger && event.pointerType === "mouse" && !pinned) show(trigger);
  });
  listen(document, "pointerout", (event) => {
    if (target(event) && !within(event.relatedTarget)) laterHide();
  });
  listen(document, "focusin", (event) => {
    const trigger = target(event);
    if (trigger && !restoringFocus && !pinned) show(trigger);
    if (within(event.target)) clearTimeout(hideTimer);
  });
  listen(document, "focusout", (event) => {
    if (within(event.target) && !within(event.relatedTarget)) laterHide();
  });
  listen(document, "click", (event) => {
    const trigger = target(event);
    if (trigger) {
      if (current === trigger && pinned) hide();
      else {
        show(trigger, true);
        // 触屏或键盘点击后把焦点移入弹层，网址和关闭按钮可以直接操作。
        card
          .querySelector<HTMLElement>("a[href], button")
          ?.focus({ preventScroll: true });
      }
    } else if (
      event.target instanceof Element &&
      event.target.closest("[data-commenter-close]")
    )
      hide(true);
    else if (!within(event.target)) hide();
  });
  card.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  card.addEventListener("pointerleave", laterHide);
  listen(document, "keydown", (event) => {
    if (event.key === "Escape" && current) {
      event.preventDefault();
      hide(true);
    }
  });
  listen(window, "scroll", () => hide(), { passive: true });
  listen(window, "resize", () => hide(), { passive: true });
  onCleanup(() => {
    hide();
    card.remove();
  });
}
