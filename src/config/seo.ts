/**
 * SEO / GEO 模块的页面描述：每种页面「是什么、标题、摘要、图片、地址」用哪些模板变量。
 *
 * 页面在 BaseLayout 上声明 `seo="post"` 等类型，components/head/Seo.astro 按这里的表达式输出
 * canonical、Open Graph、Twitter Card 和 JSON-LD。新增页面类型只需在这里加一项。
 *
 * 所有表达式都是 SpEL（不含 `${}`），在 Halo 渲染模板时求值。
 * Halo 已经输出的 description / keywords / robots 不在这里重复（见 Halo 文档「主题 SEO」）。
 */

export type SeoPage =
  | "home"
  | "post"
  | "page"
  | "category"
  | "tag"
  | "author"
  | "archives"
  | "categories"
  | "tags"
  | "moments"
  | "moment"
  | "photos"
  | "links"
  | "equipments"
  /** 不输出（404 等不该被收录的页面） */
  | "none";

export interface SeoSpec {
  /** og:type */
  ogType: "website" | "article" | "profile";
  /** 分享卡片标题（不带站点名） */
  title: string;
  /** 分享卡片摘要；为空时退回站点描述 */
  description?: string;
  /** 分享图；为空时退回设置里的默认分享图，再退回站点 Logo */
  image?: string;
  /** 当前页面（第 1 页）的站内路径 */
  path: string;
  /** 带分页的列表：当前页码表达式；第 2 页起 canonical 是 路径/page/n，不指回第 1 页 */
  page?: string;
  /** 这一页自己的 RSS（RSS 插件的分类 / 标签 / 作者订阅），没有时只声明全站订阅 */
  feed?: string;
  /** JSON-LD 的主体类型 */
  schema: "WebSite" | "BlogPosting" | "WebPage" | "CollectionPage" | "ProfilePage" | "ImageGallery" | "SocialMediaPosting";
}

const SITE_DESC = "site.seo?.description";
/** 瞬间正文（HTML）去掉标签后的前 n 个字 */
const MOMENT_TEXT = (n: number) =>
  `#strings.abbreviate(#strings.trim((moment.spec.content.html ?: '').replaceAll('<[^>]+>', ' ').replaceAll('&nbsp;', ' ').replaceAll('\\s+', ' ')), ${n})`;

export const SEO_PAGES: Record<Exclude<SeoPage, "none">, SeoSpec> = {
  home: { ogType: "website", title: "site.title", description: SITE_DESC, path: "'/'", page: "posts?.page", schema: "WebSite" },
  post: {
    ogType: "article",
    title: "post.spec.title",
    description: "post.status.excerpt",
    image: "post.spec.cover",
    path: "post.status.permalink",
    schema: "BlogPosting",
  },
  page: {
    ogType: "article",
    title: "singlePage.spec.title",
    description: "singlePage.status.excerpt",
    image: "singlePage.spec.cover",
    path: "singlePage.status.permalink",
    schema: "WebPage",
  },
  category: {
    ogType: "website",
    title: "category.spec.displayName",
    description: "category.spec.description",
    image: "category.spec.cover",
    path: "category.status.permalink",
    page: "posts?.page",
    feed: "'/feed/categories/' + category.spec.slug + '.xml'",
    schema: "CollectionPage",
  },
  tag: {
    ogType: "website",
    title: "tag.spec.displayName",
    image: "tag.spec.cover",
    path: "tag.status.permalink",
    page: "posts?.page",
    feed: "'/feed/tags/' + tag.metadata.name + '.xml'",
    schema: "CollectionPage",
  },
  author: {
    ogType: "profile",
    title: "author.spec.displayName",
    description: "author.spec.bio",
    image: "author.spec.avatar",
    path: "author.status.permalink",
    page: "posts?.page",
    feed: "'/feed/authors/' + author.metadata.name + '.xml'",
    schema: "ProfilePage",
  },
  archives: {
    ogType: "website",
    title: "theme.config.pages.archives_title ?: '文章归档'",
    path: "archives?.prevUrl?.replaceAll('/page/\\d+$', '') ?: '/archives'",
    page: "archives?.page",
    schema: "CollectionPage",
  },
  categories: { ogType: "website", title: "theme.config.pages.categories_title ?: '全部分类'", path: "site.routes?.categoriesUri ?: '/categories'", schema: "CollectionPage" },
  tags: { ogType: "website", title: "theme.config.pages.tags_title ?: '全部标签'", path: "site.routes?.tagsUri ?: '/tags'", schema: "CollectionPage" },
  moments: {
    ogType: "website",
    title: "theme.config.pages.moments_title ?: '我的动态'",
    path: "'/moments'",
    page: "moments?.page",
    feed: "'/feed/moments/rss.xml'",
    schema: "CollectionPage",
  },
  // 瞬间详情：正文的纯文本前 60 字当标题与摘要，第一张图当分享图
  moment: {
    ogType: "article",
    title: MOMENT_TEXT(60),
    description: MOMENT_TEXT(200),
    image: "#lists.isEmpty(moment.spec.content.medium) ? null : moment.spec.content.medium[0].url",
    path: "'/moments/' + moment.metadata.name",
    schema: "SocialMediaPosting",
  },
  photos: { ogType: "website", title: "theme.config.pages.photos_title ?: '我的图库'", path: "'/photos'", schema: "ImageGallery" },
  links: { ogType: "website", title: "theme.config.pages.links_title ?: '友情链接'", path: "'/links'", schema: "CollectionPage" },
  equipments: { ogType: "website", title: "title ?: '装备'", path: "'/equipments'", schema: "CollectionPage" },
};
