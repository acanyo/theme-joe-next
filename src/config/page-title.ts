/** 页面标题的 SpEL 表达式；站点主副标题由 Halo 系统设置提供。 */
export const TITLE_SEPARATOR =
  "(theme.config.seo?.title_separator == 'pipe' ? '｜' : ' - ')";

export const SITE_TITLE = `(#strings.isEmpty(#strings.trim(site.subtitle ?: '')) ? site.title : site.title + ${TITLE_SEPARATOR} + #strings.trim(site.subtitle))`;

/** 首页使用站点主副标题，内容页使用页面标题与站点主标题。 */
export function pageTitle(title?: string): string {
  return title ? `(${title}) + ${TITLE_SEPARATOR} + site.title` : SITE_TITLE;
}
