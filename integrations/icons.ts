/**
 * Vite 虚拟模块 `virtual:joe-icons`：在构建时把前端脚本用到的图标渲染成 HTML 字符串。
 * 图标集 JSON 只在构建时读取，不会进入浏览器端的包。
 */
import { iconHtml, type IconName } from "../src/config/icons.ts";

const ID = "virtual:joe-icons";
const RESOLVED = "\0" + ID;

/** 前端脚本（scripts/core/icons.ts）可用的图标 */
export const SCRIPT_ICONS = ["chevron-down", "copy", "download", "console", "close", "sun", "moon"] as const satisfies readonly IconName[];

export default function joeIcons() {
  return {
    name: "joe-icons",
    resolveId: (id: string) => (id === ID ? RESOLVED : undefined),
    load(id: string) {
      if (id !== RESOLVED) return;
      const html = Object.fromEntries(SCRIPT_ICONS.map((n) => [n, iconHtml(n)]));
      return `export default ${JSON.stringify(html)};`;
    },
  };
}
