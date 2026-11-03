/** 工具箱的品牌标记在构建期内联，不依赖运行时图标接口。 */
import { getIconData, iconToSVG } from "@iconify/utils";
import icons from "@iconify-json/simple-icons/icons.json" with { type: "json" };
const names: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  vue: "vuedotjs",
  react: "react",
  astro: "astro",
  css: "css",
  html: "html5",
  java: "openjdk",
  springboot: "springboot",
  rust: "rust",
  tauri: "tauri",
  git: "git",
  docker: "docker",
  nodejs: "nodedotjs",
  python: "python",
  postgresql: "postgresql",
};
export const ABOUT_TOOL_SYMBOLS = Object.entries(names).map(([name, icon]) => {
  const data = getIconData(icons as Parameters<typeof getIconData>[0], icon);
  if (!data) throw new Error(`Missing about tool icon: ${icon}`);
  const { attributes, body } = iconToSVG(data, { height: "1em" });
  return { name, viewBox: attributes.viewBox, body };
});
export const ABOUT_TOOL_KEYS = `{${Object.keys(names)
  .map((name) => `'${name}'`)
  .join(",")}}`;
