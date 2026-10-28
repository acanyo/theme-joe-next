/**
 * 脚本生成的 DOM 中使用的图标（`<i class="joe-font joe-icon-*">` + 内联 SVG）。
 * 内容由构建插件 integrations/icons.ts 生成，可用的图标见其中的 SCRIPT_ICONS。
 */
import ICONS from "virtual:joe-icons";

export type ScriptIcon = keyof typeof ICONS;

export function iconHtml(name: ScriptIcon): string {
  return ICONS[name];
}
