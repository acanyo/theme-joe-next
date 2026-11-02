/**
 * 文章卡片的评论者头像（components/list/PostItem.astro，设置 home.card_commenters）：
 * - 服务端只输出占位（文章名、评论数）。卡片滚到屏幕附近时请求 Halo 的公开评论接口（每篇一次），
 *   填入头像——列表页渲染时不再为每篇文章查一次评论
 * - 同一人多次评论只留一个头像（取最近一条），最多显示 4 个
 * - 悬停或键盘聚焦头像时弹出资料卡：头像、昵称、站内用户 / 访客、访客留下的网址、最近一条评论
 *
 * 资料来自评论本身：Halo 不公开登录用户的用户名，评论里带的昵称、头像就是能拿到的全部。
 * 同一人的资料按昵称缓存在本次会话中，不同卡片上的同一个人显示一致（取最先读到的那份）。
 */
import { $$ } from "../core/dom";
import { listen, observe, onCleanup } from "../core/lifecycle";
import { escapeHtml } from "../core/html";
import { relativeTime } from "./console-content";
import { fillEmptyImages } from "./image-fallback";
import { toCommenters, type PublicComment } from "./commenters-core";

const API = "/apis/api.halo.run/v1alpha1/comments";
/** 每篇取几条评论来挑头像（去重后最多显示 MAX 个） */
const FETCH = 8;

const MAX = 4;
const CACHE_KEY = "joe-next:commenters";

interface Commenter {
  name: string;
  avatar: string;
  /** User：站内登录用户；Email：填写邮箱评论的访客 */
  kind: string;
  site?: string;
  text?: string;
  time?: string;
}

/** 本次会话的资料缓存：昵称 → 资料 */
function readCache(): Record<string, Commenter> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, Commenter>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, Commenter>): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

/** 只接受 http(s) 网址，其余（javascript: 等）一律丢弃 */
function safeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function fromImage(img: HTMLImageElement): Commenter {
  const d = img.dataset;
  return {
    name: d.name ?? img.alt,
    avatar: img.currentSrc || img.src,
    kind: d.kind ?? "Email",
    site: safeUrl(d.site),
    text: d.text?.trim() || undefined,
    time: d.time,
  };
}

/** 一个占位里的头像：资料写在 data-* 上，资料卡从这里读 */
function avatarHtml(c: Commenter): string {
  const attrs: Record<string, string | undefined> = {
    "data-name": c.name,
    "data-kind": c.kind,
    "data-site": c.site,
    "data-text": c.text,
    "data-time": c.time,
    "data-text-avatar": c.name,
    "aria-label": `${c.name} 的资料`,
  };
  const extra = Object.entries(attrs)
    .filter(([, v]) => v)
    .map(([k, v]) => ` ${k}="${escapeHtml(v!)}"`)
    .join("");
  return `<img width="22" height="22" loading="lazy" tabindex="0" src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.name)}" data-fallback="avatar"${extra} />`;
}

async function fill(box: HTMLElement): Promise<void> {
  const name = box.dataset.post;
  if (!name || box.dataset.loaded) return;
  box.dataset.loaded = "true";
  try {
    const query = new URLSearchParams({ group: "content.halo.run", kind: "Post", version: "v1alpha1", name, page: "1", size: String(FETCH) });
    const response = await fetch(`${API}?${query}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const { items = [] } = (await response.json()) as { items?: PublicComment[] };
    const commenters = toCommenters(items, MAX);
    if (!commenters.length) return;
    const cache = readCache();
    for (const c of commenters) cache[c.name] ??= { ...c, site: safeUrl(c.site) };
    writeCache(cache);
    box.innerHTML = commenters.map((c) => avatarHtml({ ...c, site: safeUrl(c.site) })).join("");
    box.removeAttribute("aria-hidden");
    fillEmptyImages(box);
    requestAnimationFrame(() => box.classList.add("is-loaded"));
  } catch {
    // 头像不是必需的，失败就不显示
  }
}

/**
 * 给 root 里还没加载的占位排队：滚到屏幕附近（上下 200px）时加载。
 * 首次进入页面、加载更多、切换分类标签后都调用一次。
 */
export function loadCommenters(root: ParentNode = document): void {
  const boxes = $$<HTMLElement>(".joe_list__item .commenters[data-post]:not([data-loaded])", root);
  if (!boxes.length) return;
  if (!("IntersectionObserver" in window)) {
    boxes.forEach((box) => void fill(box));
    return;
  }
  // observe() 在离开页面（swup 切页）时自动断开
  const io = observe(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        void fill(entry.target as HTMLElement);
      }
    },
    { rootMargin: "200px 0px" },
  );
  boxes.forEach((box) => io.observe(box));
}

function cardHtml(c: Commenter, latest: Commenter): string {
  const badge =
    c.kind === "User" ? `<span class="tag tag--user">站内用户</span>` : `<span class="tag">访客</span>`;
  const site = c.site
    ? `<a class="site" href="${escapeHtml(c.site)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(new URL(c.site).host)}</a>`
    : "";
  const time = latest.time ? new Date(latest.time) : null;
  const quote = latest.text
    ? `<p class="quote">${escapeHtml(latest.text)}</p>${time && !Number.isNaN(time.getTime()) ? `<time>${relativeTime(time)}评论</time>` : ""}`
    : "";
  return `
    <div class="head">
      <img src="${escapeHtml(c.avatar)}" alt="" width="40" height="40" />
      <div class="who"><strong>${escapeHtml(c.name)}</strong>${badge}</div>
    </div>
    ${site}${quote}`;
}

/** 资料卡：整页只有一个，悬停头像时移过去 */
export function initCommenterCards(): void {
  if (!$$(".joe_list__item .commenters").length) return;
  loadCommenters();
  const card = document.createElement("div");
  card.className = "joe_commenter_card";
  card.setAttribute("role", "tooltip");
  card.hidden = true;
  document.body.appendChild(card);

  let current: HTMLImageElement | null = null;
  let hideTimer = 0;

  const place = (img: HTMLImageElement) => {
    const r = img.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    const above = r.top - h - 10;
    const top = above > 64 ? above : r.bottom + 10;
    card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top + window.scrollY)}px)`;
    card.dataset.side = above > 64 ? "top" : "bottom";
  };

  const show = (img: HTMLImageElement) => {
    clearTimeout(hideTimer);
    if (current === img && !card.hidden) return;
    current = img;
    const name = img.dataset.name || img.alt;
    const cached = readCache()[name];
    // 资料用缓存（同一人各处一致），评论内容用这张卡片对应的那条
    card.innerHTML = cardHtml(cached ?? fromImage(img), fromImage(img));
    card.hidden = false;
    card.classList.remove("is-shown");
    place(img);
    img.setAttribute("aria-describedby", "joe-commenter-card");
    requestAnimationFrame(() => card.classList.add("is-shown"));
  };

  const hide = (delay = 120) => {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      card.classList.remove("is-shown");
      current?.removeAttribute("aria-describedby");
      current = null;
      window.setTimeout(() => {
        if (!current) card.hidden = true;
      }, 160);
    }, delay);
  };

  card.id = "joe-commenter-card";
  const target = (event: Event) => (event.target as HTMLElement).closest?.<HTMLImageElement>(".commenters img") ?? null;
  listen(document, "pointerover", (event: PointerEvent) => {
    const img = target(event);
    if (img) show(img);
  });
  listen(document, "pointerout", (event: PointerEvent) => {
    if (target(event)) hide();
  });
  listen(document, "focusin", (event: FocusEvent) => {
    const img = target(event);
    if (img) show(img);
  });
  listen(document, "focusout", (event: FocusEvent) => {
    if (target(event)) hide(0);
  });
  // 鼠标移到资料卡上（点网址）时保持显示
  card.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  card.addEventListener("pointerleave", () => hide());
  listen(document, "keydown", (event: KeyboardEvent) => event.key === "Escape" && hide(0));
  listen(window, "scroll", () => hide(0), { passive: true });
  onCleanup(() => card.remove());
}
