/** 新鲜度标记的去留规则（features/freshness.ts 使用；不依赖 DOM，便于测试） */

/**
 * 读过之后是否去掉标记：「新」读过即去掉；「已更新」要在修改时间（edited，毫秒）之后读过。
 * lastRead 为该文章最近一次阅读时间，未读过为 undefined。
 */
export function isBadgeSeen(kind: "new" | "updated", lastRead: number | undefined, edited?: number): boolean {
  if (!lastRead) return false;
  return kind === "new" || (!!edited && lastRead > edited);
}
