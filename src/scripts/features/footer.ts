/** 页脚：固定定位间距、站点运行时间、建站纪念进度 */
import { $ } from "../core/dom";
import { getThemeConfig } from "../core/config";

function initFixedFooter(): void {
  if (!getThemeConfig().footerFixed) return;
  const footer = $(".joe_footer");
  const root = $("#Joe");
  if (footer && root) root.style.marginBottom = `${footer.offsetHeight + 30}px`;
}

/** 支持时间戳或 `yyyy/MM/dd HH:mm(:ss)` 格式 */
export function parseBirthday(value: string): Date | null {
  if (/^\d+$/.test(value)) return new Date(Number(value));
  if (/^\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(value))
    return new Date(value);
  return null;
}

/** 运行天数：只显示天，一分钟刷新一次即可 */
function initRuntime(): void {
  const config = getThemeConfig();
  const day = $(".joe_footer__life .joe_run__day");
  if (!config.enableBirthday || !day) return;
  const birthday = parseBirthday(config.birthday);
  if (!birthday) {
    console.warn("[joe-next] 「自定义博客起始时间」格式错误：", config.birthday);
    return;
  }
  const tick = () => {
    const days = Math.max(0, Math.floor((Date.now() - birthday.getTime()) / 86_400_000));
    day.textContent = days.toLocaleString("zh-CN");
  };
  tick();
  day.closest(".joe_footer__life")?.setAttribute("title", `起始于 ${birthday.toLocaleDateString("zh-CN")}`);
  // 页脚常驻（不在 swup 容器内），计时器贯穿整个会话
  setInterval(tick, 60_000);
}

/** 建站纪念：从起始时间到第 N 年（如「十年之约」）走了多少，达成后显示已坚持的年数 */
export function anniversaryProgress(since: Date, years: number, now = new Date()): { ratio: number; daysLeft: number } {
  const goal = new Date(since);
  goal.setFullYear(since.getFullYear() + years);
  const total = goal.getTime() - since.getTime();
  const ratio = Math.min(1, Math.max(0, (now.getTime() - since.getTime()) / total));
  return { ratio, daysLeft: Math.max(0, Math.ceil((goal.getTime() - now.getTime()) / 86_400_000)) };
}

function initAnniversary(): void {
  const box = $<HTMLElement>(".joe_footer__life .site_anniversary");
  const since = parseBirthday(getThemeConfig().birthday);
  if (!box || !since) return;
  const years = Math.max(1, Number(box.dataset.years) || 10);
  const name = box.dataset.label || `${years} 年之约`;
  const { ratio, daysLeft } = anniversaryProgress(since, years);
  const goal = new Date(since);
  goal.setFullYear(since.getFullYear() + years);
  const fmt = (d: Date) => d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
  const set = (sel: string, text: string) => {
    const el = $(sel, box);
    if (el) el.textContent = text;
  };
  set(".name", name);
  set(".pct", daysLeft > 0 ? `${Math.floor(ratio * 100)}%` : "已达成");
  set(".hint", daysLeft > 0 ? `${fmt(since)} → ${fmt(goal)} · 还有 ${daysLeft.toLocaleString("zh-CN")} 天` : `${fmt(since)} 起已满 ${years} 年`);
  $<HTMLElement>(".fill", box)?.style.setProperty("width", `${ratio * 100}%`);
  box.hidden = false;
}

export function initFooter(): void {
  initFixedFooter();
  initRuntime();
  initAnniversary();
}
