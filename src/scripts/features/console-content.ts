/**
 * 中控台内容（components/navbar/ConsolePanel.astro）：面板放入页面时调用 renderConsoleContent。
 *
 * - 欢迎语：登录用户 / 评论组件记住的访客 用昵称打招呼，附上 Ta 的评论数
 * - 发文日历：当月日历，有文章的日子可点
 * - 文章栏：最近 / 热门 / 置顶 三个标签页
 * - 我的互动：访客自己的评论（邮箱哈希比对）与最近看过的文章（features/visitor.ts）
 * - 时间显示为「3 天前」这类相对时间
 */
import { $, $$ } from "../core/dom";
import { escapeHtml } from "../content/shortcode-parse";
import { commentIdentity, readHistory } from "./visitor";

/** 「3 天前」「刚刚」；超过 30 天显示日期 */
export function relativeTime(date: Date, now = Date.now()): string {
  const diff = Math.max(0, now - date.getTime());
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const same = new Date(now).getFullYear() === y;
  return `${same ? "" : `${y}-`}${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function renderTimes(root: ParentNode): void {
  $$<HTMLTimeElement>("time[datetime]", root).forEach((time) => {
    const date = new Date(time.dateTime);
    if (Number.isNaN(date.getTime())) return;
    time.title = date.toLocaleString("zh-CN");
    if (time.closest(".joe_console__comment, .joe_console__mine")) time.textContent = relativeTime(date);
  });
}

/** 文章栏的三个标签页 */
function bindTabs(root: HTMLElement): void {
  const tabs = $$<HTMLButtonElement>("[data-console-tab]", root);
  const select = (name: string) => {
    tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.consoleTab === name)));
    $$<HTMLElement>("[data-console-tabpanel]", root).forEach(
      (panel) => (panel.hidden = panel.dataset.consoleTabpanel !== name),
    );
  };
  tabs.forEach((tab) => tab.addEventListener("click", () => select(tab.dataset.consoleTab!)));
}

/** 发文日历：当月，有文章的日子标出并可点击（多篇时进入第一篇） */
function renderCalendar(root: HTMLElement, today = new Date()): void {
  const grid = $("[data-console-calendar]", root);
  if (!grid) return;
  const year = today.getFullYear();
  const month = today.getMonth();
  const posts = new Map<number, { href: string; titles: string[] }>();
  $$<HTMLElement>("[data-console-published] li", root).forEach((li) => {
    const [y, m, d] = (li.dataset.date ?? "").split("-").map(Number);
    if (y !== year || m !== month + 1 || !d) return;
    const entry = posts.get(d) ?? { href: li.dataset.href ?? "", titles: [] };
    entry.titles.push(li.dataset.title ?? "");
    posts.set(d, entry);
  });
  const label = $("[data-console-month]", root);
  if (label) label.textContent = `${year} 年 ${month + 1} 月 · 发文 ${[...posts.values()].reduce((n, p) => n + p.titles.length, 0)} 篇`;

  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: string[] = ["日", "一", "二", "三", "四", "五", "六"].map((w) => `<span class="week">${w}</span>`);
  for (let i = 0; i < first; i++) cells.push("<span></span>");
  for (let d = 1; d <= days; d++) {
    const post = posts.get(d);
    const cls = `${d === today.getDate() ? " is-today" : ""}`;
    cells.push(
      post
        ? `<a class="day has-post${cls}" href="${escapeHtml(post.href)}" title="${escapeHtml(post.titles.join("\n"))}">${d}</a>`
        : `<span class="day${cls}">${d}</span>`,
    );
  }
  grid.innerHTML = cells.join("");
}

/** 访客身份：登录用户优先，其次是评论组件记住的访客 */
async function visitor(root: HTMLElement): Promise<{ name: string; emailHash?: string; user?: boolean } | null> {
  const user = $<HTMLElement>("[data-console-user]", root);
  if (user?.dataset.name) return { name: user.dataset.name, user: true };
  return commentIdentity();
}

function myComments(root: HTMLElement, me: { name: string; emailHash?: string; user?: boolean }): HTMLElement[] {
  return $$<HTMLElement>("[data-console-pool] li", root).filter((li) =>
    me.user
      ? li.dataset.ownerKind === "User" && li.dataset.owner === me.name
      : !!me.emailHash && li.dataset.emailHash === me.emailHash,
  );
}

function renderMine(root: HTMLElement, mine: HTMLElement[]): void {
  const list = $("[data-console-mine]", root);
  const empty = $("[data-console-mine-empty]", root);
  if (!list || !empty) return;
  empty.hidden = mine.length > 0;
  list.innerHTML = mine
    .slice(0, 8)
    .map((li) => {
      const title = li.dataset.title ? escapeHtml(li.dataset.title) : "";
      const href = li.dataset.href ? escapeHtml(li.dataset.href) : "";
      return `<article class="joe_console__comment">
        <div class="body">
          <p class="meta"><time datetime="${escapeHtml(li.dataset.time ?? "")}"></time>${title ? `<span class="on">评论了</span>` : ""}</p>
          <p class="what">${escapeHtml(li.textContent ?? "")}</p>
          ${href ? `<a class="where" href="${href}#comment" title="${title}"><span>${title}</span></a>` : ""}
        </div>
      </article>`;
    })
    .join("");
  renderTimes(list);
}

function renderHistory(root: HTMLElement): void {
  const list = $("[data-console-history]", root);
  const empty = $("[data-console-history-empty]", root);
  if (!list || !empty) return;
  const history = readHistory().slice(0, 8);
  empty.hidden = history.length > 0;
  list.innerHTML = history
    .map(
      (item) => `<li><a href="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}">
        <span class="text">${escapeHtml(item.title)}</span>
        <span class="progress" style="--p: ${Math.round(item.progress * 100)}%" aria-label="已读 ${Math.round(item.progress * 100)}%"></span>
        <time>${escapeHtml(relativeTime(new Date(item.last)))}</time>
      </a></li>`,
    )
    .join("");
}

/** 欢迎语：认出访客时「欢迎回来，昵称」并给出 Ta 的足迹 */
function renderGreeting(root: HTMLElement, me: { name: string } | null, mineCount: number): void {
  const greeting = $("[data-console-greeting]", root);
  if (!greeting || !me?.name) return;
  const site = escapeHtml(root.querySelector<HTMLElement>("[data-site-name]")?.dataset.siteName ?? "");
  const visits = readHistory().length;
  const parts = [mineCount ? `留下了 ${mineCount} 条评论` : "", visits ? `读过 ${visits} 篇文章` : ""].filter(Boolean);
  greeting.innerHTML = `欢迎回来，<strong>${escapeHtml(me.name)}</strong>${parts.length ? `，你在 ${site} ${parts.join("、")}` : ""}`;
}

/** 视图切换：全站动态 / 我的互动（记住访客上次选择的视图） */
function bindViews(root: HTMLElement): void {
  const KEY = "joe-next:console-view";
  const buttons = $$<HTMLButtonElement>("[data-console-switch]", root);
  const select = (name: string) => {
    buttons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.consoleSwitch === name)));
    $$<HTMLElement>("[data-console-view]", root).forEach((view) => (view.hidden = view.dataset.consoleView !== name));
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

/** 面板首次放入页面时调用 */
export function renderConsoleContent(root: HTMLElement): void {
  bindViews(root);
  bindTabs(root);
  renderCalendar(root);
  renderTimes(root);
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $$("[data-console-kbd]", root).forEach((k) => (k.textContent = "Ctrl K"));
  void visitor(root).then((me) => {
    const mine = me ? myComments(root, me) : [];
    renderGreeting(root, me, mine.length);
    renderMine(root, mine);
  });
}

/** 每次打开时刷新与浏览器状态相关的部分（阅读记录会随浏览变化） */
export function refreshConsoleContent(root: HTMLElement): void {
  renderHistory(root);
}
