/**
 * 博主社交账号图标。键与 settings.yaml 中 `blogger.social_links[].platform` 的取值一致。
 * `href` 为 SpEL 表达式，`socials.url` 是当前遍历项的地址。
 */
import type { IconName } from "../config/icons";

export interface SocialPlatform {
  /** 同时是图标名（config/icons.ts） */
  name: IconName;
  title: string;
  href: string;
  /** 品牌色，图标以此着色 */
  color: string;
}

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    name: "github",
    title: "Github",
    href: "socials.url",
    color: "var(--text-title)",
  },
  {
    name: "gitee",
    title: "Gitee",
    href: "socials.url",
    color: "#c71d23",
  },
  {
    name: "zhihu",
    title: "知乎",
    href: "socials.url",
    color: "#0066ff",
  },
  {
    name: "telegram",
    title: "Telegram",
    href: "socials.url",
    color: "#26a5e4",
  },
  {
    name: "juejin",
    title: "掘金社区",
    href: "socials.url",
    color: "#1e80ff",
  },
  {
    name: "bilibili",
    title: "B站",
    href: "socials.url",
    color: "#fb7299",
  },
  {
    name: "qq",
    title: "QQ",
    href: "'//wpa.qq.com/msgrd?v=3&uin=' + socials.url + '&site=qq&menu=yes'",
    color: "#12b7f5",
  },
  {
    name: "wechat",
    title: "微信",
    href: "socials.url",
    color: "#07c160",
  },
  {
    name: "weibo",
    title: "微博",
    href: "socials.url",
    color: "#e6162d",
  },
  {
    name: "email",
    title: "邮箱",
    href: "'mailto:' + socials.url",
    color: "#dc4835",
  },
  {
    name: "douban",
    title: "豆瓣",
    href: "socials.url",
    color: "#2d963d",
  },
  {
    name: "tiktok",
    title: "tiktok",
    href: "socials.url",
    color: "var(--text-title)",
  },
  {
    name: "facebook",
    title: "facebook",
    href: "socials.url",
    color: "#1877f2",
  },
  {
    name: "instagram",
    title: "instagram",
    href: "socials.url",
    color: "#e4405f",
  },
  {
    name: "linkedin",
    title: "linkedin",
    href: "socials.url",
    color: "#0a66c2",
  },
  {
    name: "twitter",
    title: "twitter",
    href: "socials.url",
    color: "#1d9bf0",
  },
  {
    name: "x",
    title: "x",
    href: "socials.url",
    color: "var(--text-title)",
  },
  {
    name: "slack",
    title: "slack",
    href: "socials.url",
    color: "#4a154b",
  },
  {
    name: "discord",
    title: "discord",
    href: "socials.url",
    color: "#5865f2",
  },
  {
    name: "steam",
    title: "steam",
    href: "socials.url",
    color: "#1b2838",
  },
  {
    name: "youtube",
    title: "youtube",
    href: "socials.url",
    color: "#ff0000",
  },
  {
    name: "gitlab",
    title: "gitlab",
    href: "socials.url",
    color: "#fc6d26",
  },
];
