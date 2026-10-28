/**
 * CSS 级联层（@layer）：src/styles 下的每个文件按所在目录放入对应的层，层的先后决定优先级，
 * 后面的层总是覆盖前面的层，与选择器权重无关。
 *
 *   reset → tokens → vendor → base → components → layout → content → pages
 *
 * components 在 layout 之前：头部、侧栏、页脚等布局区域包含组件，并按所在位置覆盖组件样式。
 *
 * - 组件、页面样式不再需要 `html ...` 前缀或 `#Joe` 来抬高权重。
 * - 层的顺序在 src/styles/index.css 开头声明（须与 LAYER_ORDER 一致，tests/css-layers.test.ts 校验）。
 * - 按需加载的第三方样式（Swiper、PhotoSwipe）放入 vendor 层（core/stylesheet.ts），主题对它们的覆盖照常生效。
 * - 未分层的样式优先级最高：主题设置生成的动态样式、插件样式，以及用户在 Halo「代码注入」中写的 CSS，
 *   都能直接覆盖主题，无需 !important。
 */
import type { AtRule, ChildNode, Plugin } from "postcss";

export const LAYER_ORDER = [
  "reset",
  "tokens",
  "vendor",
  "base",
  "components",
  "layout",
  "content",
  "pages",
] as const;

export type Layer = (typeof LAYER_ORDER)[number];

/** 文件路径 -> 层名；不在 src/styles 下的文件（第三方 CSS 等）不处理 */
export function layerOf(file: string): Layer | undefined {
  const m = /\/src\/styles\/(?:(base|vendor|layout|components|content|pages)\/)?([\w-]+)\.css$/.exec(
    file.replaceAll("\\", "/"),
  );
  if (!m) return undefined;
  const [, dir, name] = m;
  if (!dir) return undefined; // index.css 只是入口，由各文件自行分层
  if (dir === "base") {
    if (name === "normalize") return "reset";
    if (name === "tokens") return "tokens";
  }
  return dir as Layer;
}

/**
 * 构建时按「每个顶层规则的来源文件」分层：Vite 会先内联 @import，所以同一个产物里混有多个文件的规则，
 * 连续来自同一层的规则合并进一个 @layer 块。
 */
export default function cssLayers(): Plugin {
  return {
    postcssPlugin: "joe-css-layers",
    OnceExit(root, { AtRule }) {
      // 先按顺序分组，再统一移动，避免遍历时修改节点列表
      const groups: { layer: Layer; nodes: ChildNode[] }[] = [];
      for (const node of root.nodes) {
        const top = node.type === "atrule" && ["import", "charset", "layer"].includes(node.name);
        const layer = top ? undefined : layerOf(node.source?.input.file ?? "");
        const last = groups.at(-1);
        if (!layer) groups.push({ layer: undefined as never, nodes: [] });
        else if (last?.layer === layer) last.nodes.push(node);
        else groups.push({ layer, nodes: [node] });
      }
      for (const { layer, nodes } of groups) {
        if (!layer || !nodes.length) continue;
        const block = new AtRule({ name: "layer", params: layer, source: nodes[0]!.source });
        nodes[0]!.before(block);
        for (const node of nodes) block.append(node.remove());
      }
    },
  };
}
cssLayers.postcss = true as const;
