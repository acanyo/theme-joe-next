/** 内容扩展设置的构建期表达式；未填写时保留主题原有行为。 */
export const annotationIsTrue = (
  subject: "post" | "singlePage",
  key: string,
): string =>
  `#annotations.getOrDefault(${subject}, '${key}', 'false') == 'true'`;

export const PAGE_TITLE_VISIBLE = `!(${annotationIsTrue("singlePage", "hide_title")})`;
export const PAGE_META_VISIBLE = `theme.config.post.meta and !(${annotationIsTrue("singlePage", "hide_meta")})`;
export const POST_ASIDE_ENABLED = `theme.config.aside.on_post and !(${annotationIsTrue("post", "disable_sidebar")})`;
export const POST_COPYRIGHT_ENABLED = `!(${annotationIsTrue("post", "disable_copyright")})`;

const PAGE_WIDTH =
  "#annotations.getOrDefault(singlePage, 'content_width', 'default')";

/** 宽度只映射到固定值，元数据不直接写入 CSS。 */
export const pageReadingWidth = (fallback: string): string =>
  `${PAGE_WIDTH} == 'narrow' ? '640px' : (${PAGE_WIDTH} == 'wide' ? '960px' : (${PAGE_WIDTH} == 'full' ? 'none' : (${fallback})))`;

export const DEFAULT_READING_WIDTH =
  "theme.config.post.reading_width == 0 ? 'none' : (theme.config.post.reading_width ?: 760) + 'px'";
export const PAGE_LAYOUT_ATTRIBUTES = `data-page-width=\${${PAGE_WIDTH}}, data-page-transparent=\${${annotationIsTrue("singlePage", "transparent_background")}}`;
