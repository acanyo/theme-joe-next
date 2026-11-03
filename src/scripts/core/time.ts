/** 时间格式化 */

const UNITS: [number, string][] = [
  [60, "秒"],
  [60, "分钟"],
  [24, "小时"],
  [30, "天"],
  [12, "个月"],
];

/** 相对时间（「3 分钟前」）；超过一年显示日期 */
export function timeAgo(date: Date, now = new Date()): string {
  let diff = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diff < 10) return "刚刚";
  for (const [step, unit] of UNITS) {
    if (diff < step) return `${diff} ${unit}前`;
    diff = Math.floor(diff / step);
  }
  return date.toLocaleDateString("zh-CN");
}

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
