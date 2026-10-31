/**
 * 构建期使用的 Thymeleaf / SpEL 表达式片段。
 *
 * 多个模板共用的服务端判断集中在这里，避免在组件中重复拼写长表达式。
 * 这些字符串只在 Astro 构建时使用，最终原样写入模板，由 Halo 在请求时求值。
 */

/** 评论是否可用：由 Halo 判定（已安装并启用评论组件插件，且未被全局关闭） */
export const COMMENT_ENABLED = "haloCommentEnabled == true";

/**
 * 颜色模式：设置从「基础」分组移到「外观」后，已保存旧值的站点仍读得到（appearance → general → 默认 user）。
 */
export const COLOR_MODE = "theme.config.appearance?.color_mode ?: (theme.config.general?.color_mode ?: 'user')";

/** 博主显示名：昵称为空时回退到站点标题 */
export const BLOGGER_NAME = "theme.config.blogger.name ?: site.title";

/** 站点地址（去掉末尾斜杠） */
export const SITE_URL =
  "#strings.endsWith(site.url, '/') ? #strings.substring(site.url, 0, #strings.length(site.url) - 1) : site.url";

/** 当前文章的完整地址 */
export const POST_URL = `(${SITE_URL}) + post.status.permalink`;

/** 文章页操作项开关：全局设置 + 文章元数据 */
export const LIKE_ENABLED = "theme.config.post.like";
export const SHARE_ENABLED = "theme.config.share.enabled";
export const DONATE_ENABLED = "theme.config.share.donate";

/**
 * 全站共用的统计：布局（BaseLayout、layout.astro）在 <div id="Joe"> 上查一次，存为 siteStats / tagCount，
 * 导航抽屉、博主卡片、页脚、归档页都用这两个变量，不再各自查询。
 * tagCount 用分页查询的 total，不把所有标签取出来再数。
 */
export const SHARED_STATS = "siteStats = ${siteStatsFinder.getStats()}, tagCount = ${tagFinder.list(1, 1).total}";

/**
 * 文章页的相关文章：同分类（没有分类时同标签），多取一篇以便去掉当前这篇。
 * 文章页在正文与侧栏外面查一次（pages/post.astro 的 relatedList），正文下方的卡片和侧栏列表共用。
 */
export const RELATED_POSTS =
  "#lists.isEmpty(post.categories) ? (#lists.isEmpty(post.tags) ? {} : postFinder.listByTag(1, #conversions.convert((theme.config.post.related_count ?: 5) + 1, 'java.lang.Integer'), post.tags[0].metadata.name).items) : postFinder.listByCategory(1, #conversions.convert((theme.config.post.related_count ?: 5) + 1, 'java.lang.Integer'), post.categories[0].metadata.name).items";

/** 包裹为 `${...}` */
export const el = (expr: string): string => `\${${expr}}`;

/** 主题内静态资源地址，供属性中拼接使用（`#theme.assets` 已处理 base 与 CDN） */
export const asset = (path: string): string => `#theme.assets('${path}')`;

/**
 * 评论的纯文本预览（变量 comment）：评论内容是 HTML，表情图片（<img alt="[微笑]">）换成 alt 文字，
 * 其余标签、&nbsp; 与多余空白去掉后截取。SpEL 字符串中的单引号写作 ''。
 */
export const COMMENT_TEXT =
  "#strings.abbreviate(#strings.trim((comment.spec.content ?: '')" +
  ".replaceAll('<img[^>]*?alt=[\"'']([^\"'']*)[\"''][^>]*>', '$1')" +
  ".replaceAll('<[^>]+>', ' ').replaceAll('&nbsp;', ' ').replaceAll('\\s+', ' ')), 120)";

/**
 * 封面图（文章、分类、标签）：自身封面 → 设置中的默认缩略图 → 随机图接口 → 空。
 * Halo 中「没有封面」存的是空字符串而不是 null，所以用 isEmpty 判断，不能用 ?:。
 * @param item 变量名，如 "post"、"category"
 */
export const coverOf = (item: string): string =>
  `(not #strings.isEmpty(${item}.spec.cover) ? ${item}.spec.cover : ` +
  `(not #strings.isEmpty(theme.config.home.default_thumbnail) ? theme.config.home.default_thumbnail : ` +
  `(theme.config.home.random_thumbnail and not #strings.isEmpty(theme.config.home.random_thumbnail_api) ? ` +
  `theme.config.home.random_thumbnail_api + '?pageid=' + ${item}.metadata.name : '')))`;
