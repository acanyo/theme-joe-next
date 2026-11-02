/** 评论者头像的纯函数（无 DOM 依赖，便于单元测试） */

/** Halo 公开评论接口返回的单条评论里用到的字段 */
export interface PublicComment {
  metadata?: { deletionTimestamp?: string | null };
  owner?: { displayName?: string; avatar?: string; kind?: string };
  spec?: {
    approved?: boolean;
    hidden?: boolean;
    content?: string;
    creationTime?: string;
    owner?: { annotations?: Record<string, string> };
  };
}

/** 与 Comment Next 相同：已有头像优先，邮箱访客使用公开哈希获取 WeAvatar。 */
export function commentAvatar(comment: PublicComment): string {
  const avatar = comment.owner?.avatar?.trim();
  if (avatar) return avatar;
  const hash = comment.spec?.owner?.annotations?.["email-hash"]?.trim();
  if (comment.owner?.kind !== "Email" || !hash || !/^(?:[a-f\d]{32}|[a-f\d]{64})$/i.test(hash)) return "";
  return `https://weavatar.com/avatar/${hash.toLowerCase()}?d=404&f=webp&s=96`;
}

export interface CommenterData {
  name: string;
  avatar: string;
  kind: string;
  site?: string;
  text?: string;
  time?: string;
}

/**
 * 评论 HTML → 纯文本预览（与模板里的 COMMENT_TEXT 一致）：
 * 表情图片换成 alt 文字，其余标签、&nbsp; 与多余空白去掉，最多 120 字。
 */
export function commentText(html: string, max = 120): string {
  const text = html
    .replace(/<img[^>]*?alt=["']([^"']*)["'][^>]*>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** 接口返回的评论 → 头像资料；同一人只留最近的一条（接口按时间倒序），最多 max 个 */
export function toCommenters(items: PublicComment[], max: number): CommenterData[] {
  const out: CommenterData[] = [];
  const seen = new Set<string>();
  for (const c of items) {
    // 管理员或评论者本人访问接口时也可能拿到私有数据；资料卡只展示已审核且未隐藏的评论。
    if (c.spec?.approved !== true || c.spec.hidden !== false || c.metadata?.deletionTimestamp) continue;
    const name = c.owner?.displayName?.trim();
    if (!name) continue;
    const kind = c.owner?.kind ?? "Email";
    const hash = c.spec.owner?.annotations?.["email-hash"]?.trim().toLowerCase();
    const identity = JSON.stringify([kind, hash || [name, c.owner?.avatar?.trim() || ""]]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    out.push({
      name,
      avatar: commentAvatar(c),
      kind,
      site: kind === "Email" ? c.spec?.owner?.annotations?.website : undefined,
      text: commentText(c.spec?.content ?? "") || undefined,
      time: c.spec?.creationTime,
    });
    if (out.length >= max) break;
  }
  return out;
}
