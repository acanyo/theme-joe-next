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
