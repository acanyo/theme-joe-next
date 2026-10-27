/**
 * 构建期使用的 Thymeleaf / SpEL 表达式片段。
 *
 * 多个模板共用的服务端判断集中在这里，避免在组件中重复拼写长表达式。
 * 这些字符串只在 Astro 构建时使用，最终原样写入模板，由 Halo 在请求时求值。
 */

/** 是否启用 Waline 评论（需同时选择 waline 且填写服务端地址） */
export const WALINE_ENABLED =
  "theme.config.basic.comment_option == 'waline' and #strings.trim(theme.config.basic.waline.waline_serverURL) != ''";

/** 是否使用 Halo 评论扩展点（未选择 Waline，且 Halo 判定评论可用，例如已安装评论插件） */
export const HALO_COMMENT_ENABLED = `!(${WALINE_ENABLED}) and haloCommentEnabled == true`;

/** 是否有任一评论系统可用 */
export const ANY_COMMENT_ENABLED = `(${WALINE_ENABLED}) or haloCommentEnabled == true`;

/** 博主显示名：昵称为空时回退到站点标题 */
export const BLOGGER_NAME = "theme.config.blogger.nickname ?: site.title";

/** 包裹为 `${...}` */
export const el = (expr: string): string => `\${${expr}}`;

/** 主题内静态资源地址，供属性中拼接使用（`#theme.assets` 已处理 base 与 CDN） */
export const asset = (path: string): string => `#theme.assets('${path}')`;
