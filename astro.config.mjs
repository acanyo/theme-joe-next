// @ts-check
import { defineConfig } from "astro/config";
import thymeleafTags from "./integrations/thymeleaf-tags.ts";
import cssLayers from "./integrations/css-layers.ts";
import joeIcons from "./integrations/icons.ts";

// base 必须与 theme.yaml 的 metadata.name 一致（Halo 主题静态资源路径为 /themes/<name>/assets）
export default defineConfig({
  base: "/themes/theme-joe-next",
  build: {
    assets: "assets",
    format: "file",
  },
  outDir: "./templates",
  integrations: [thymeleafTags()],
  vite: {
    // 主题样式按目录分入 CSS 级联层（见 integrations/css-layers.ts）
    css: { postcss: { plugins: [cssLayers()] } },
    // 前端脚本用到的图标在构建时内联（见 integrations/icons.ts）
    plugins: [joeIcons()],
    build: {
      // 体积较大的依赖（hls.js、vConsole）均为按需动态加载，不影响首屏
      chunkSizeWarningLimit: 600,
    },
  },
});
