/** 评论者头像的纯函数（无 DOM 依赖，便于单元测试） */

/** Halo 公开评论接口返回的单条评论里用到的字段 */
export interface PublicComment {
  owner?: { displayName?: string; avatar?: string; kind?: string };
  spec?: {
    content?: string;
    creationTime?: string;
    owner?: { annotations?: Record<string, string> };
  };
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
    const name = c.owner?.displayName?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const kind = c.owner?.kind ?? "Email";
    out.push({
      name,
      avatar: c.owner?.avatar ?? "",
      kind,
      site: kind === "Email" ? c.spec?.owner?.annotations?.website : undefined,
      text: commentText(c.spec?.content ?? "") || undefined,
      time: c.spec?.creationTime,
    });
    if (out.length >= max) break;
  }
  return out;
}
