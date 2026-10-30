/**
 * 主题图标：构建时从 Iconify 图标集（lucide / Remix Icon / Simple Icons）取出 SVG 并内联，
 * 页面不加载图标字体、也不请求 Iconify CDN。
 *
 * 模板中用 <Icon name="..." />（components/Icon.astro），脚本中用 iconSvg("...")（scripts/core/icons.ts）。
 * 新增图标：在 ICONS 中登记「主题内的语义名 → Iconify 图标名」。
 */
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json" with { type: "json" };
import ri from "@iconify-json/ri/icons.json" with { type: "json" };
import simpleIcons from "@iconify-json/simple-icons/icons.json" with { type: "json" };

type IconSet = Parameters<typeof getIconData>[0];

const SETS: Record<string, IconSet> = {
  lucide: lucide as IconSet,
  ri: ri as IconSet,
  "simple-icons": simpleIcons as IconSet,
};

/** 语义名 → Iconify 图标名（前缀:名称） */
export const ICONS = {
  // 导航
  menu: "lucide:menu",
  search: "lucide:search",
  "chevron-down": "lucide:chevron-down",
  "chevron-right": "lucide:chevron-right",
  "chevron-left": "lucide:chevron-left",
  "chevrons-down": "lucide:chevrons-down",
  user: "lucide:circle-user",
  home: "lucide:house",
  "menu-item": "lucide:hash",
  console: "lucide:layout-dashboard",
  sun: "lucide:sun",
  "arrow-up": "lucide:arrow-up",
  shuffle: "lucide:shuffle",
  moon: "lucide:moon",
  close: "lucide:x",
  // 文章与列表
  toc: "lucide:list-tree",
  link: "lucide:link",
  share: "lucide:share-2",
  pinned: "lucide:pin",
  "fresh-new": "lucide:sparkles",
  "fresh-updated": "lucide:refresh-cw",
  reward: "lucide:gift",
  like: "lucide:thumbs-up",
  "like-fill": "ri:thumb-up-fill",
  heart: "lucide:heart",
  "heart-fill": "ri:heart-3-fill",
  comment: "lucide:message-circle",
  reply: "lucide:reply",
  views: "lucide:eye",
  image: "lucide:image",
  feather: "lucide:feather",
  edit: "lucide:pen-line",
  copy: "lucide:copy",
  download: "lucide:download",
  send: "lucide:send",
  // 页面与侧栏
  hot: "lucide:flame",
  category: "lucide:layout-grid",
  folder: "lucide:folder",
  archive: "lucide:archive",
  calendar: "lucide:calendar",
  timeline: "lucide:git-commit-vertical",
  notice: "lucide:megaphone",
  coffee: "lucide:coffee",
  qrcode: "lucide:qr-code",
  hourglass: "lucide:hourglass",
  tag: "lucide:tag",
  // 页脚
  runtime: "lucide:zap",
  rss: "lucide:rss",
  "page-views": "lucide:chart-line",
  visitors: "lucide:monitor",
  "page-visitors": "lucide:mouse-pointer-click",
  // 社交平台
  github: "ri:github-fill",
  gitee: "simple-icons:gitee",
  zhihu: "ri:zhihu-fill",
  telegram: "ri:telegram-fill",
  juejin: "simple-icons:juejin",
  bilibili: "ri:bilibili-fill",
  qq: "ri:qq-fill",
  wechat: "ri:wechat-fill",
  weibo: "ri:weibo-fill",
  email: "ri:mail-fill",
  douban: "ri:douban-fill",
  tiktok: "ri:tiktok-fill",
  facebook: "ri:facebook-circle-fill",
  instagram: "ri:instagram-fill",
  linkedin: "ri:linkedin-box-fill",
  twitter: "ri:twitter-fill",
  x: "ri:twitter-x-fill",
  slack: "ri:slack-fill",
  discord: "ri:discord-fill",
  steam: "ri:steam-fill",
  youtube: "ri:youtube-fill",
  gitlab: "ri:gitlab-fill",
} as const;

export type IconName = keyof typeof ICONS;

const cache = new Map<IconName, string>();

/** 内联 SVG：尺寸 1em、颜色 currentColor，与图标字体的字号/颜色规则用法相同 */
export function iconSvg(name: IconName): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const [prefix, icon] = ICONS[name].split(":") as [string, string];
  const set = SETS[prefix];
  const data = set && getIconData(set, icon);
  if (!data) throw new Error(`[joe-next] 未找到图标 ${ICONS[name]}（${name}）`);
  const { attributes, body } = iconToSVG(data, { height: "1em" });
  const svg = iconToHTML(replaceIDs(body), {
    ...attributes,
    "aria-hidden": "true",
    focusable: "false",
  });
  cache.set(name, svg);
  return svg;
}

/**
 * 完整的图标元素 `<i class="joe-font joe-icon-<name>">svg</i>`。
 * 沿用原图标字体的元素与类名，现有样式（`.joe-font`、`i`、`.joe-icon-*` 选择器）无需改动。
 */
export function iconHtml(name: IconName, className = ""): string {
  return `<i class="joe-font joe-icon-${name}${className ? ` ${className}` : ""}" aria-hidden="true">${iconSvg(name)}</i>`;
}
