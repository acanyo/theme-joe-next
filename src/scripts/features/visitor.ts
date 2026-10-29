/**
 * 访客在本站的足迹，只保存在浏览器中（localStorage），供中控台「我的互动」使用：
 * - 阅读记录：打开文章时记下标题、地址与阅读进度，最多 30 条
 * - 评论身份：评论组件提交评论时保存的昵称与邮箱（键 halo-comment-custom-account），
 *   用邮箱的 SHA-256 与公开评论中的 email-hash 比对，找出访客自己的评论
 */
import { $, throttle } from "../core/dom";
import { listen } from "../core/lifecycle";

const HISTORY_KEY = "joe-next:history";
const HISTORY_MAX = 30;
/** 评论组件（PluginCommentWidget）保存访客信息的键 */
const COMMENT_ACCOUNT_KEY = "halo-comment-custom-account";

export interface HistoryItem {
  href: string;
  title: string;
  /** 首次阅读与最近阅读时间（毫秒） */
  first: number;
  last: number;
  /** 阅读进度 0–1 */
  progress: number;
}

export function readHistory(): HistoryItem[] {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(list) ? (list as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(list: HistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {
    // 存储不可用时不记录
  }
}

/** 从控制中心「继续阅读」进入时，滚动到上次读到的位置 */
function resumePosition(): void {
  let target: { href?: string; progress?: number } = {};
  try {
    target = JSON.parse(sessionStorage.getItem("joe-next:resume") ?? "{}");
    sessionStorage.removeItem("joe-next:resume");
  } catch {
    return;
  }
  if (target.href !== location.pathname || !target.progress) return;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.round(max * target.progress!) - 80, behavior: "instant" });
  });
}

/** 文章页调用：记录本次阅读，并随滚动更新进度 */
export function recordReading(): void {
  resumePosition();
  const title = $("h1")?.textContent?.trim() || document.title.split(" - ")[0]!.trim();
  const href = location.pathname;
  const now = Date.now();
  const list = readHistory();
  const old = list.find((item) => item.href === href);
  const item: HistoryItem = { href, title, first: old?.first ?? now, last: now, progress: old?.progress ?? 0 };
  writeHistory([item, ...list.filter((i) => i.href !== href)]);

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, window.scrollY / max) : 1;
    if (progress <= item.progress) return;
    item.progress = progress;
    const current = readHistory();
    const target = current.find((i) => i.href === href);
    if (target) {
      target.progress = progress;
      writeHistory(current);
    }
  };
  listen(document, "scroll", throttle(update, 1000), { passive: true });
}

export interface CommentIdentity {
  name: string;
  /** 邮箱 SHA-256（小写十六进制），与公开评论的 email-hash 对应 */
  emailHash?: string;
}

/** 评论组件记住的访客身份；没有留过言时返回 null */
export async function commentIdentity(): Promise<CommentIdentity | null> {
  let account: { displayName?: string; email?: string };
  try {
    account = JSON.parse(localStorage.getItem(COMMENT_ACCOUNT_KEY) ?? "{}") ?? {};
  } catch {
    return null;
  }
  if (!account.displayName && !account.email) return null;
  // Halo 对提交时的邮箱原样计算哈希（不去空格、不转小写），这里保持一致
  const email = account.email;
  return {
    name: account.displayName?.trim() || email?.split("@")[0] || "",
    emailHash: email && crypto.subtle ? await sha256(email) : undefined,
  };
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
