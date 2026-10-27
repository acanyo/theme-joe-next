/**
 * 构建期使用的 Thymeleaf / SpEL 表达式片段。
 *
 * 多个模板共用的服务端判断集中在这里，避免在组件中重复拼写长表达式。
 * 这些字符串只在 Astro 构建时使用，最终原样写入模板，由 Halo 在请求时求值。
 */

/** 评论是否可用：由 Halo 判定（已安装并启用评论组件插件，且未被全局关闭） */
export const COMMENT_ENABLED = "haloCommentEnabled == true";

/** 「评论后可见」是否对当前访问者生效（作者本人、评论不可用时不限制） */
export const READ_LIMIT_ACTIVE = (subject: string): string =>
  `#annotations.getOrDefault(${subject}, 'enable_read_limit', 'false') == 'true' and (${COMMENT_ENABLED}) and #authentication.name != ${subject}.spec.owner`;

/** 博主显示名：昵称为空时回退到站点标题 */
export const BLOGGER_NAME = "theme.config.blogger.nickname ?: site.title";

/** 站点地址（去掉末尾斜杠） */
export const SITE_URL =
  "#strings.endsWith(site.url, '/') ? #strings.substring(site.url, 0, #strings.length(site.url) - 1) : site.url";

/** 当前文章的完整地址 */
export const POST_URL = `(${SITE_URL}) + post.status.permalink`;

/** 文章页操作项开关：全局设置 + 文章元数据 */
const postSwitch = (setting: string, annotation: string) =>
  `theme.config.post.${setting} and #annotations.getOrDefault(post, '${annotation}', 'true') == 'true'`;
export const LIKE_ENABLED = postSwitch("enable_like", "enable_like");
export const SHARE_ENABLED = postSwitch("enable_share", "enable_share");
export const DONATE_ENABLED = postSwitch("enable_donate", "enable_donate");

/** 包裹为 `${...}` */
export const el = (expr: string): string => `\${${expr}}`;

/** 主题内静态资源地址，供属性中拼接使用（`#theme.assets` 已处理 base 与 CDN） */
export const asset = (path: string): string => `#theme.assets('${path}')`;
