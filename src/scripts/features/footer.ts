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

function initRuntime(): void {
  const config = getThemeConfig();
  const container = $(".site_life");
  if (!config.enableBirthday || !container) return;
  const birthday = parseBirthday(config.birthday);
  if (!birthday) {
    console.warn(
      "[joe-next] 「自定义博客起始时间」格式错误：",
      config.birthday,
    );
    return;
  }
  const fields = {
    day: $(".joe_run__day", container),
    hour: $(".joe_run__hour", container),
    minute: $(".joe_run__minute", container),
    second: $(".joe_run__second", container),
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  const tick = () => {
    let rest = Math.max(
      0,
      Math.floor((Date.now() - birthday.getTime()) / 1000),
    );
    const day = Math.floor(rest / 86400);
    rest %= 86400;
    if (fields.day) fields.day.textContent = pad(day);
    if (fields.hour) fields.hour.textContent = pad(Math.floor(rest / 3600));
    if (fields.minute)
      fields.minute.textContent = pad(Math.floor((rest % 3600) / 60));
    if (fields.second) fields.second.textContent = pad(rest % 60);
  };
  tick();
  // 页脚常驻（不在 swup 容器内），计时器贯穿整个会话
  setInterval(tick, 1000);
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
  const box = $<HTMLElement>(".site_anniversary");
  const since = parseBirthday(getThemeConfig().birthday);
  if (!box || !since) return;
  const years = Math.max(1, Number(box.dataset.years) || 10);
  const label = box.dataset.label || `${years} 年之约`;
  const { ratio, daysLeft } = anniversaryProgress(since, years);
  const pct = Math.floor(ratio * 100);
  const text = $(".text", box);
  if (text)
    text.innerHTML =
      daysLeft > 0
        ? `${label}已走过 <strong>${pct}%</strong>，还有 <strong>${daysLeft.toLocaleString("zh-CN")}</strong> 天`
        : `${label}已达成 🎉`;
  $<HTMLElement>(".bar > span", box)?.style.setProperty("width", `${ratio * 100}%`);
  box.title = `起始于 ${since.toLocaleDateString("zh-CN")}，目标 ${years} 年`;
  box.hidden = false;
}

export function initFooter(): void {
  initFixedFooter();
  initRuntime();
  initAnniversary();
}
