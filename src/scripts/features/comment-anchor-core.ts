/** Halo 与 Comment Next 的评论固定链接格式。 */
export interface CommentAnchor {
  commentName?: string;
  replyName?: string;
  section?: string;
  native: boolean;
}

export function parseCommentAnchor(hash: string): CommentAnchor | null {
  let value = hash.replace(/^#/, "");
  try {
    // 参数中的值由 URLSearchParams 解码，避免把已编码的 & 误当成参数分隔符。
    if (!value.includes("=")) value = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (
    ["comments", "comment", "halo-comment"].includes(value) ||
    /^comment-(?:content|moment|plugin)-/.test(value)
  ) {
    return { section: value, native: false };
  }
  const next = /^comment-next-(comment|reply)-(.+)$/.exec(value);
  if (next)
    return {
      [next[1] === "comment" ? "commentName" : "replyName"]: next[2],
      native: true,
    };
  const params = new URLSearchParams(value);
  const commentName = params.get("halo-comment")?.trim();
  if (!commentName) return null;
  return {
    commentName,
    replyName: params.get("reply") || undefined,
    native: false,
  };
}

export function officialCommentHash(anchor: CommentAnchor): string | null {
  if (!anchor.commentName) return null;
  const params = new URLSearchParams({ "halo-comment": anchor.commentName });
  if (anchor.replyName) params.set("reply", anchor.replyName);
  return `#${params}`;
}
