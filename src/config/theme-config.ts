/**
 * 主题运行时配置契约。
 *
 * 服务端（Thymeleaf）把 `theme.config` 中前端需要的字段序列化为一个 JSON 对象，
 * 通过 `<script type="application/json" id="joe-config">` 注入页面；
 * 浏览器端代码只通过 {@link readThemeConfig} 读取，不再依赖全局变量。
 *
 * `SERVER_CONFIG_FIELDS` 是两端共享的唯一来源：Astro 构建时据此生成 SpEL 表达式，
 * TypeScript 据此推导类型，新增字段只需改这一处。
 */

/** 前端字段名 -> 服务端 SpEL 取值表达式 */
export const SERVER_CONFIG_FIELDS = {
  themeMode: "theme.config.basic.theme_mode",
  lightTimeScope: "theme.config.basic.light_time_scope",
  enableLoadingBar: "theme.config.theme.enable_loading_bar",
  enableBack2top: "theme.config.theme.enable_back2top",
  enableBack2topSmooth: "theme.config.theme.enable_back2top_smooth",
  enableFixedHeader: "theme.config.navbar.enable_fixed_header",
  linkBehavior: "theme.config.theme.link_behavior",
  pageTransition: "theme.config.theme.page_transition",
  swupPreload: "theme.config.theme.swup_preload",
  cursorEffect: "theme.config.theme.cursor_effect",
  backdrop: "theme.config.theme.backdrop",
  enableOffscreenTip: "theme.config.theme.enable_offscreen_tip",
  offscreenTitleLeave: "theme.config.theme.offscreen_title_leave",
  offscreenTitleBack: "theme.config.theme.offscreen_title_back",
  enableCleanMode: "theme.config.other.enable_clean_mode",
  enableConsoleTheme: "theme.config.other.enable_console_theme",
  enableDebug: "theme.config.other.enable_debug",
  showLoadedTime: "theme.config.custom.show_loaded_time",
  favicon: "theme.config.custom.favicon",
  footerPosition: "theme.config.footer.footer_position",
  enableBirthday: "theme.config.footer.enable_birthday",
  birthday: "theme.config.footer.custom_birthday",
  enableIndexListAjax: "theme.config.home.enable_index_list_ajax",
  enableAutoAjax: "theme.config.home.enable_auto_ajax",
  enableIndexListEffect: "theme.config.home.enable_index_list_effect",
  indexListEffectClass: "theme.config.home.index_list_effect_class",
  fallbackThumbnail: "theme.config.home.fallback_thumbnail",
  enableBanner: "theme.config.carousel.enable_banner",
  bannerDirection: "theme.config.carousel.banner_direction",
  bannerEffect: "theme.config.carousel.banner_effect",
  enableBannerLoop: "theme.config.carousel.enable_banner_loop",
  enableBannerAutoplay: "theme.config.carousel.enable_banner_autoplay",
  enableBannerHandle: "theme.config.carousel.enable_banner_handle",
  bannerDelay: "theme.config.carousel.banner_delay",
  bannerSpeed: "theme.config.carousel.banner_speed",
  enableBigBanner: "theme.config.beauty.enable_big_banner",
  bigBannerTitle: "theme.config.beauty.big_banner_title",
  enableBigBannerHitokoto: "theme.config.beauty.enable_big_banner_hitokoto",
  defaultAvatar: "theme.config.blogger.default_avatar",
  generateAvatarOpts: "theme.config.blogger.generate_avatar_opts",
  linksDefaultLogo: "theme.config.links.links_default_logo",
  enableCodeTitle: "theme.config.code_block.enable_code_title",
  enableCodeHr: "theme.config.code_block.enable_code_hr",
  enableCodeMacdot: "theme.config.code_block.enable_code_macdot",
  enableCodeCopy: "theme.config.code_block.enable_code_copy",
  enableCodeLineNumber: "theme.config.code_block.enable_code_line_number",
  enableCodeNewline: "theme.config.code_block.enable_code_newline",
  enableCodeExpander: "theme.config.code_block.enable_code_expander",
  enableFoldLongCode: "theme.config.code_block.enable_fold_long_code",
  longCodeHeight: "theme.config.code_block.long_code_height",
  showToolsWhenHover: "theme.config.code_block.show_tools_when_hover",
  codeTheme: "theme.config.code_block.code_theme",
  enableToc: "theme.config.post.enable_toc",
  tocDepth: "theme.config.post.toc_depth",
  enableProgressBar: "theme.config.post.enable_progress_bar",
  enableCopyRightText: "theme.config.post.enable_copy_right_text",
  copyRightText: "theme.config.post.copy_right_text",
  enableJournalEffect: "theme.config.journals.enable_journal_effect",
  journalListEffectClass: "theme.config.journals.journal_list_effect_class",
  journalBlockHeight: "theme.config.journals.journal_block_height",
  enableFriendEffect: "theme.config.friends.enable_friend_effect",
  friendListEffectClass: "theme.config.friends.friend_list_effect_class",
  enableLinksRandom: "theme.config.links.enable_links_random",
  siteTitle: "site.title",
  version: "theme.spec.version",
} as const;

export type ServerConfigKey = keyof typeof SERVER_CONFIG_FIELDS;

/** 服务端原样输出的值（ConfigMap 中的数字常以字符串形式存储） */
type RawValue = string | number | boolean | null | undefined;

export type RawThemeConfig = Record<ServerConfigKey, RawValue>;

export type ThemeMode = "user" | "auto" | "light" | "dark";
export type ColorMode = "light" | "dark";

export interface AvatarOptions {
  bgColor?: string;
  textColor?: string;
  useTextGradient?: boolean;
}

/** 浏览器端使用的规范化配置 */
export interface ThemeConfig {
  themeMode: ThemeMode;
  lightTimeScope: string;
  enableLoadingBar: boolean;
  enableBack2top: boolean;
  enableBack2topSmooth: boolean;
  enableFixedHeader: boolean;
  linkBehavior: "default" | "current" | "new";
  pageTransition: "none" | "native" | "swup";
  swupPreload: boolean;
  cursorEffect: string;
  backdrop: string;
  enableOffscreenTip: boolean;
  offscreenTitleLeave: string;
  offscreenTitleBack: string;
  enableCleanMode: boolean;
  enableConsoleTheme: boolean;
  enableDebug: boolean;
  showLoadedTime: boolean;
  favicon: string;
  footerFixed: boolean;
  enableBirthday: boolean;
  birthday: string;
  enableIndexListAjax: boolean;
  enableAutoAjax: boolean;
  enableIndexListEffect: boolean;
  indexListEffectClass: string;
  fallbackThumbnail: string;
  banner: {
    enabled: boolean;
    direction: "horizontal" | "vertical";
    effect: string;
    loop: boolean;
    autoplay: boolean;
    handle: boolean;
    delay: number;
    speed: number;
  };
  bigBanner: {
    enabled: boolean;
    title: string;
    hitokoto: boolean;
  };
  defaultAvatar: string;
  avatarOptions: AvatarOptions;
  linksDefaultLogo: string;
  code: {
    title: boolean;
    hr: boolean;
    macdot: boolean;
    copy: boolean;
    lineNumber: boolean;
    newline: boolean;
    expander: boolean;
    foldLong: boolean;
    longHeight: number;
    toolsOnHover: boolean;
    theme: string;
  };
  post: {
    toc: boolean;
    tocDepth: number;
    progressBar: boolean;
    copyRightText: string;
  };
  journal: { effect: boolean; effectClass: string; blockHeight: number };
  friend: { effect: boolean; effectClass: string };
  enableLinksRandom: boolean;
  siteTitle: string;
  version: string;
  /** 主题静态资源根路径，由服务端 `#theme.assets()` 计算 */
  assetsBase: string;
}

/** 生成注入页面用的 SpEL 内联 Map 表达式 */
export function buildServerConfigExpression(): string {
  const entries = Object.entries(SERVER_CONFIG_FIELDS).map(
    ([key, expr]) => `'${key}': ${expr}`,
  );
  return `{ ${entries.join(", ")} }`;
}

const toBool = (v: RawValue, fallback = false): boolean => {
  if (v === null || v === undefined || v === "") return fallback;
  if (typeof v === "boolean") return v;
  return String(v) === "true";
};

const toNumber = (v: RawValue, fallback: number): number => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
};

const toStr = (v: RawValue, fallback = ""): string =>
  v === null || v === undefined ? fallback : String(v);

/**
 * 解析 `{bgColor:'',textColor:'',useTextGradient:false}` 这种宽松对象字面量。
 * 设置项历史上就是这种格式，这里做一次安全的规范化，不使用 eval。
 */
export function parseAvatarOptions(input: string): AvatarOptions {
  if (!input.trim()) return {};
  try {
    const json = input
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":');
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object"
      ? (parsed as AvatarOptions)
      : {};
  } catch {
    console.warn(
      "[joe-next] generate_avatar_opts 解析失败，使用默认配置：",
      input,
    );
    return {};
  }
}

export function normalizeThemeConfig(
  raw: RawThemeConfig,
  assetsBase: string,
): ThemeConfig {
  const themeMode = toStr(raw.themeMode, "user");
  const linkBehavior = toStr(raw.linkBehavior, "default");
  return {
    themeMode: (["user", "auto", "light", "dark"].includes(themeMode)
      ? themeMode
      : "user") as ThemeMode,
    lightTimeScope: toStr(raw.lightTimeScope, "5:00~19:00"),
    enableLoadingBar: toBool(raw.enableLoadingBar, true),
    enableBack2top: toBool(raw.enableBack2top, true),
    enableBack2topSmooth: toBool(raw.enableBack2topSmooth, true),
    enableFixedHeader: toBool(raw.enableFixedHeader, true),
    pageTransition: (["none", "native", "swup"].includes(
      toStr(raw.pageTransition),
    )
      ? toStr(raw.pageTransition)
      : "native") as ThemeConfig["pageTransition"],
    swupPreload: toBool(raw.swupPreload, true),
    linkBehavior: (["default", "current", "new"].includes(linkBehavior)
      ? linkBehavior
      : "default") as ThemeConfig["linkBehavior"],
    cursorEffect: toStr(raw.cursorEffect, "off"),
    backdrop: toStr(raw.backdrop, "off"),
    enableOffscreenTip: toBool(raw.enableOffscreenTip),
    offscreenTitleLeave: toStr(raw.offscreenTitleLeave),
    offscreenTitleBack: toStr(raw.offscreenTitleBack),
    enableCleanMode: toBool(raw.enableCleanMode),
    enableConsoleTheme: toBool(raw.enableConsoleTheme),
    enableDebug: toBool(raw.enableDebug),
    showLoadedTime: toBool(raw.showLoadedTime),
    favicon: toStr(raw.favicon),
    footerFixed: toStr(raw.footerPosition) === "fixed",
    enableBirthday: toBool(raw.enableBirthday),
    birthday: toStr(raw.birthday),
    enableIndexListAjax: toBool(raw.enableIndexListAjax),
    enableAutoAjax: toBool(raw.enableAutoAjax),
    enableIndexListEffect: toBool(raw.enableIndexListEffect, true),
    indexListEffectClass: toStr(raw.indexListEffectClass, "fadeInUp"),
    fallbackThumbnail: toStr(raw.fallbackThumbnail),
    banner: {
      enabled: toBool(raw.enableBanner, true),
      direction:
        toStr(raw.bannerDirection) === "vertical" ? "vertical" : "horizontal",
      effect: toStr(raw.bannerEffect, "slide"),
      loop: toBool(raw.enableBannerLoop, true),
      autoplay: toBool(raw.enableBannerAutoplay, true),
      handle: toBool(raw.enableBannerHandle, true),
      delay: toNumber(raw.bannerDelay, 3500),
      speed: toNumber(raw.bannerSpeed, 500),
    },
    bigBanner: {
      enabled: toBool(raw.enableBigBanner),
      title: toStr(raw.bigBannerTitle) || toStr(raw.siteTitle),
      hitokoto: toBool(raw.enableBigBannerHitokoto, true),
    },
    defaultAvatar: toStr(raw.defaultAvatar),
    avatarOptions: parseAvatarOptions(toStr(raw.generateAvatarOpts)),
    linksDefaultLogo: toStr(raw.linksDefaultLogo),
    code: {
      title: toBool(raw.enableCodeTitle, true),
      hr: toBool(raw.enableCodeHr, true),
      macdot: toBool(raw.enableCodeMacdot, true),
      copy: toBool(raw.enableCodeCopy, true),
      lineNumber: toBool(raw.enableCodeLineNumber, true),
      newline: toBool(raw.enableCodeNewline),
      expander: toBool(raw.enableCodeExpander),
      foldLong: toBool(raw.enableFoldLongCode),
      longHeight: toNumber(raw.longCodeHeight, 800),
      toolsOnHover: toBool(raw.showToolsWhenHover, true),
      theme: toStr(raw.codeTheme, "one-dark"),
    },
    post: {
      toc: toBool(raw.enableToc, true),
      tocDepth: toNumber(raw.tocDepth, 0),
      progressBar: toBool(raw.enableProgressBar, true),
      copyRightText: toBool(raw.enableCopyRightText, true)
        ? toStr(raw.copyRightText)
        : "",
    },
    journal: {
      effect: toBool(raw.enableJournalEffect, true),
      effectClass: toStr(raw.journalListEffectClass, "fadeInUp"),
      blockHeight: toNumber(raw.journalBlockHeight, 300),
    },
    friend: {
      effect: toBool(raw.enableFriendEffect, true),
      effectClass: toStr(raw.friendListEffectClass, "fadeInUp"),
    },
    enableLinksRandom: toBool(raw.enableLinksRandom),
    siteTitle: toStr(raw.siteTitle),
    version: toStr(raw.version, "0.0.0"),
    assetsBase: assetsBase.replace(/\/$/, ""),
  };
}

export const CONFIG_ELEMENT_ID = "joe-config";
