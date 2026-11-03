/**
 * 文章卡片的评论者头像（components/list/PostItem.astro，设置 home.card_commenters）：
 * - 服务端只输出占位（文章名、评论数）。卡片滚到屏幕附近时请求 Halo 的公开评论接口（每篇一次），
 *   填入头像——列表页渲染时不再为每篇文章查一次评论
 * - 同一人多次评论只留一个头像（取最近一条），最多显示 4 个
 * - 悬停或键盘聚焦头像时弹出资料卡：头像、昵称、站内用户 / 访客、访客留下的网址、最近一条评论
 *
 * 资料来自当前文章的公开评论，只展示已审核且未隐藏的内容，不跨文章按昵称缓存资料。
 */
import { $$ } from "../core/dom";
import { observe } from "../core/lifecycle";
import { escapeHtml } from "../core/html";
import { fillEmptyImages } from "./image-fallback";
import { commenterWebsite, toCommenters, type CommenterData as Commenter, type PublicComment } from "./commenters-core";

const API = "/apis/api.halo.run/v1alpha1/comments";
/** 每篇取几条评论来挑头像（去重后最多显示 MAX 个） */
const FETCH = 8;

const MAX = 4;

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
  return `<button type="button" class="joe_commenter_trigger" aria-haspopup="dialog" aria-expanded="false"${extra}><img width="22" height="22" loading="lazy" src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.name)}" data-text-avatar="${escapeHtml(c.name)}" data-fallback="avatar" /></button>`;
}

async function fill(box: HTMLElement): Promise<void> {
  const name = box.dataset.post;
  if (!name || box.dataset.loaded) return;
  box.dataset.loaded = "true";
  try {
    const query = new URLSearchParams({ group: "content.halo.run", kind: "Post", version: "v1alpha1", name, page: "1", size: String(FETCH) });
    const response = await fetch(`${API}?${query}`, {
      credentials: "omit",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const { items = [] } = (await response.json()) as { items?: PublicComment[] };
    const commenters = toCommenters(items, MAX);
    if (!commenters.length) return;
    box.innerHTML = commenters.map((c) => avatarHtml({ ...c, site: commenterWebsite(c.site) })).join("");
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
