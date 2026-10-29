/**
 * 响应式图片：用 Halo 的缩略图 Finder（thumbnail.gen，Halo 2.19+）生成 srcset，
 * 按图片实际显示宽度给出 sizes，浏览器只下载需要的尺寸。
 *
 * Halo 2.22+ 会给没有 srcset 的图片自动补上 srcset 与一个通用的 sizes（约 85vw），
 * 对缩略图、头像这类小图仍然偏大，所以主题为主要的图片位置显式给出 sizes。
 * 外链图片（非附件）thumbnail.gen 会原样返回地址，srcset 中各项相同，浏览器照常加载原图。
 */

/** Halo 预设的缩略图宽度 */
const WIDTHS = { s: 400, m: 800, l: 1200, xl: 1600 } as const;
type Size = keyof typeof WIDTHS;

/**
 * 生成 th:src / th:srcset / sizes 三个属性。
 * @param uri 图片地址的 SpEL 表达式（不含 `${}`）
 * @param sizes 图片显示宽度（HTML sizes 属性）
 * @param variants 提供的缩略图尺寸，默认 s / m / l
 */
export function responsiveImage(
  uri: string,
  sizes: string,
  variants: readonly Size[] = ["s", "m", "l"],
): Record<"th:src" | "th:srcset" | "sizes", string> {
  const largest = variants.at(-1)!;
  return {
    "th:src": `\${thumbnail.gen(${uri}, '${largest === "xl" ? "l" : largest}')}`,
    "th:srcset": `|${variants.map((v) => `\${thumbnail.gen(${uri}, '${v}')} ${WIDTHS[v]}w`).join(", ")}|`,
    sizes,
  };
}

/** 各图片位置的显示宽度（与样式中的尺寸对应） */
export const SIZES = {
  /** 文章列表缩略图：桌面约 210px，窄屏 120px */
  listThumb: "(max-width: 768px) 120px, 210px",
  /** 首页轮播：内容区宽度 */
  banner: "(max-width: 768px) 100vw, (max-width: 1360px) 75vw, 1000px",
  /** 精选推荐、标签 / 分类卡片 */
  card: "(max-width: 500px) 50vw, (max-width: 992px) 33vw, 240px",
  /** 文章沉浸头图背景：整宽 */
  hero: "100vw",
  /** 侧栏 / 抽屉中的博主卡片背景：侧栏宽度 */
  aside: "280px",
  /** 头像（最大 75px，按 2 倍屏取 150px） */
  avatar: "75px",
  /** 图库网格 */
  photo: "(max-width: 768px) 50vw, 33vw",
} as const;
