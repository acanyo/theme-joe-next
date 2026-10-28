/** 文章字数与阅读时长估算（纯函数，供 content/article.ts 使用） */

/**
 * 中文按字、英文按词统计，阅读时长按每分钟 400 字 / 200 词估算（不足 1 分钟按 1 分钟）。
 * 代码块不计入：读代码的速度与正文不同，算进去会明显高估。
 */
export function readingStats(text: string): { words: number; minutes: number } {
  const cjk = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latin = text.replace(/[\u4e00-\u9fa5]/g, " ").match(/[a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*/g)?.length ?? 0;
  return { words: cjk + latin, minutes: Math.max(1, Math.round(cjk / 400 + latin / 200)) };
}
