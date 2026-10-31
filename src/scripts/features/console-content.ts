/**
 * 控制中心内容（components/navbar/ConsolePanel.astro）：面板放入页面时调用 renderConsoleContent。
 *
 * - 年度进度环、站点已运行天数、一言
 * - 站点动态：文章 / 评论 / 瞬间按时间混排成一条时间线
 * - 我的足迹：继续阅读（读到一半的文章）、我的评论（邮箱哈希比对）、最近看过
 */
import { $, $$ } from "../core/dom";
import { escapeHtml } from "../core/html";
import { commentIdentity, readHistory } from "./visitor";

/** 「3 天前」「刚刚」；超过 30 天显示日期 */
export function relativeTime(date: Date, now = Date.now()): string {
  const diff = Math.max(0, now - date.getTime());
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 2 * day) return "昨天";
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const sameYear = new Date(now).getFullYear() === y;
  return `${sameYear ? "" : `${y}-`}${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 今年已过去的比例 */
export function yearProgress(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return (now.getTime() - start) / (end - start);
}

function renderTime(root: HTMLElement): void {
  const p = yearProgress();
  const pct = Math.floor(p * 100);
  const ring = $("[data-console-year]", root);
  if (ring) {
    ring.style.setProperty("--p", String(p * 100));
    ring.setAttribute("aria-label", `今年已过去 ${pct}%`);
    const label = $(".pct", ring);
    if (label) label.textContent = `${pct}%`;
  }
  const now = new Date();
  const left = Math.ceil((new Date(now.getFullYear() + 1, 0, 1).getTime() - now.getTime()) / 86_400_000);
  const yearText = $("[data-console-year-text]", root);
  if (yearText) yearText.innerHTML = `${now.getFullYear()} 年还剩 <strong>${left}</strong> 天`;

  const since = $<HTMLElement>("[data-since]", root)?.dataset.since;
  const sinceDate = since ? new Date(since.replace(/-/g, "/")) : null;
  const uptime = $("[data-console-uptime]", root);
  if (uptime && sinceDate && !Number.isNaN(sinceDate.getTime())) {
    const days = Math.floor((now.getTime() - sinceDate.getTime()) / 86_400_000);
    uptime.innerHTML = `本站已运行 <strong>${days.toLocaleString("zh-CN")}</strong> 天`;
    uptime.hidden = false;
  }

  const quote = $("[data-console-quote]", root);
  if (quote)
    void fetch("https://v1.hitokoto.cn/?c=d&c=i&c=k&max_length=28")
      .then((r) => r.json() as Promise<{ hitokoto: string; from?: string }>)
      .then((r) => {
        quote.textContent = r.hitokoto;
        quote.title = r.from ? `出自《${r.from}》` : "";
      })
      .catch(() => quote.remove());
}

interface FeedItem {
  kind: "post" | "comment" | "moment";
  time: Date;
  href?: string;
  title?: string;
  who?: string;
  text?: string;
}

const KIND_LABEL: Record<FeedItem["kind"], string> = { post: "发布了文章", comment: "评论了", moment: "发布了瞬间" };

function readSource(li: HTMLElement): FeedItem | null {
  const time = new Date(li.dataset.time ?? "");
  if (Number.isNaN(time.getTime())) return null;
  return {
    kind: (li.dataset.kind as FeedItem["kind"]) ?? "comment",
    time,
    href: li.dataset.href || undefined,
    title: li.dataset.title || undefined,
    who: li.dataset.who || li.dataset.owner || undefined,
    text: li.textContent?.trim() || undefined,
  };
}

function feedItemHtml(item: FeedItem, opts: { who?: boolean } = {}): string {
  const who = opts.who !== false && item.who ? `<span class="who">${escapeHtml(item.who)}</span>` : "";
  const action = `<span class="act">${KIND_LABEL[item.kind]}</span>`;
  const title = item.title ? `<span class="obj">${escapeHtml(item.title)}</span>` : "";
  const text = item.text && item.kind !== "post" ? `<span class="text">${escapeHtml(item.text)}</span>` : "";
  const time = `<time datetime="${item.time.toISOString()}" title="${escapeHtml(item.time.toLocaleString("zh-CN"))}">${relativeTime(item.time)}</time>`;
  const body = `<span class="kind kind--${item.kind}" aria-hidden="true"></span><span class="line">${who}${action}${title}</span>${text}${time}`;
  return `<li>${item.href ? `<a href="${escapeHtml(item.href)}">${body}</a>` : `<div>${body}</div>`}</li>`;
}

function renderFeed(root: HTMLElement): void {
  const feed = $("[data-console-feed]", root);
  const empty = $("[data-console-feed-empty]", root);
  if (!feed || !empty) return;
  const items = $$<HTMLElement>("[data-console-source] li", root)
    .map(readSource)
    .filter((i): i is FeedItem => !!i)
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 12);
  empty.hidden = items.length > 0;
  feed.innerHTML = items.map((i) => feedItemHtml(i)).join("");
}

interface Visitor {
  name: string;
  emailHash?: string;
  user?: boolean;
}

async function visitor(root: HTMLElement): Promise<Visitor | null> {
  const user = $<HTMLElement>("[data-console-user]", root);
  if (user?.dataset.name) return { name: user.dataset.name, user: true };
  return commentIdentity();
}

function renderMine(root: HTMLElement, me: Visitor | null): void {
  const list = $("[data-console-mine]", root);
  const empty = $("[data-console-mine-empty]", root);
  if (!list || !empty) return;
  const mine = me
    ? $$<HTMLElement>("[data-console-pool] li", root).filter((li) =>
        me.user
          ? li.dataset.ownerKind === "User" && li.dataset.owner === me.name
          : !!me.emailHash && li.dataset.emailHash === me.emailHash,
      )
    : [];
  empty.hidden = mine.length > 0;
  list.innerHTML = mine
    .slice(0, 6)
    .map(readSource)
    .filter((i): i is FeedItem => !!i)
    .map((i) => feedItemHtml({ ...i, kind: "comment" }, { who: false }))
    .join("");
  if (me?.name) {
    const tab = $<HTMLElement>("[data-console-switch='me']", root);
    if (tab) tab.title = `${me.name} 的足迹`;
  }
}

function renderHistory(root: HTMLElement): void {
  const list = $("[data-console-history]", root);
  const empty = $("[data-console-history-empty]", root);
  const resume = $("[data-console-resume]", root);
  if (!list || !empty || !resume) return;
  const history = readHistory().filter((h) => h.href !== location.pathname);
  empty.hidden = history.length > 0;
  list.innerHTML = history
    .slice(0, 6)
    .map(
      (h) => `<li><a href="${escapeHtml(h.href)}" title="${escapeHtml(h.title)}">
        <span class="text">${escapeHtml(h.title)}</span>
        <span class="bar" style="--p: ${Math.round(h.progress * 100)}%" aria-label="已读 ${Math.round(h.progress * 100)}%"></span>
        <time>${relativeTime(new Date(h.last))}</time>
      </a></li>`,
    )
    .join("");
  // 继续阅读：最近一篇读到一半（10%–90%）的文章
  const unfinished = history.find((h) => h.progress > 0.1 && h.progress < 0.9);
  resume.hidden = !unfinished;
  if (unfinished)
    resume.innerHTML = `<a href="${escapeHtml(unfinished.href)}" data-progress="${unfinished.progress}">
      <span class="tag">继续阅读</span>
      <span class="text">${escapeHtml(unfinished.title)}</span>
      <span class="pct">${Math.round(unfinished.progress * 100)}%</span>
    </a>`;
}

/** 页签：站点动态 / 我的足迹（本次会话记住选择） */
function bindPages(root: HTMLElement): void {
  const KEY = "joe-next:console-view";
  const buttons = $$<HTMLButtonElement>("[data-console-switch]", root);
  const select = (name: string) => {
    buttons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.consoleSwitch === name)));
    $$<HTMLElement>("[data-console-view]", root).forEach((v) => (v.hidden = v.dataset.consoleView !== name));
    try {
      sessionStorage.setItem(KEY, name);
    } catch {
      // ignore
    }
  };
  buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.consoleSwitch!)));
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && buttons.some((b) => b.dataset.consoleSwitch === saved)) select(saved);
  } catch {
    // ignore
  }
}

/** 继续阅读：记下要恢复的位置，文章页打开后滚动过去（features/visitor.ts） */
function bindResume(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-console-resume] a");
    if (!link) return;
    try {
      sessionStorage.setItem(
        "joe-next:resume",
        JSON.stringify({ href: link.pathname, progress: Number(link.dataset.progress) }),
      );
    } catch {
      // ignore
    }
  });
}

/** 面板首次放入页面时调用 */
export function renderConsoleContent(root: HTMLElement): void {
  bindPages(root);
  bindResume(root);
  renderTime(root);
  renderFeed(root);
  void visitor(root).then((me) => renderMine(root, me));
}

/** 每次打开时刷新与浏览状态相关的部分 */
export function refreshConsoleContent(root: HTMLElement): void {
  renderHistory(root);
}
