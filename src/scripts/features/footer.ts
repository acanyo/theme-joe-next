/** 页脚：固定定位间距、站点运行时间 */
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
  setInterval(tick, 1000);
}

export function initFooter(): void {
  initFixedFooter();
  initRuntime();
}
