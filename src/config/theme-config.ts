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
  // 这三项从「基础」移到了「外观」，读不到时回退旧位置
  themeMode: "theme.config.appearance?.color_mode ?: (theme.config.general?.color_mode ?: 'user')",
  lightTimeScope: "theme.config.appearance?.light_hours ?: theme.config.general?.light_hours",
  enableLoadingBar: "theme.config.effects.loading_bar",
  enableBack2top: "theme.config.effects.back_to_top",
  enableBack2topSmooth: "theme.config.effects.back_to_top_smooth",
  enableFixedHeader: "theme.config.navbar.sticky",
  pageTransition: "theme.config.effects.swup ? 'swup' : (theme.config.effects.page_animation == 'none' ? 'none' : 'native')",
  swupPreload: "theme.config.effects.swup_preload",
  cursorEffect: "theme.config.effects.cursor_effect",
  backdrop: "theme.config.effects.backdrop",
  enableContextMenu: "theme.config.effects.context_menu",
  enableOffscreenTip: "theme.config.effects.offscreen_title",
  offscreenTitleLeave: "theme.config.effects.offscreen_title_leave",
  offscreenTitleBack: "theme.config.effects.offscreen_title_back",
  enableCleanMode: "theme.config.footer.clean_mode",
  enableConsoleTheme: "theme.config.footer.console_banner",
  enableDebug: "theme.config.footer.debug",
  showLoadedTime: "theme.config.footer.console_timing",
  footerPosition: "theme.config.footer.position",
  enableBirthday: "theme.config.footer.uptime",
  birthday: "theme.config.footer.since",
  enableIndexListAjax: "theme.config.home.load_more",
  enableAutoAjax: "theme.config.home.infinite_scroll",
  enableIndexListEffect: "theme.config.effects.list_animation",
  indexListEffectClass: "theme.config.effects.list_animation_name",
  fallbackThumbnail: "theme.config.home.fallback_thumbnail",
  enableBanner: "theme.config.home.carousel",
  bannerDirection: "theme.config.home.carousel_direction",
  bannerEffect: "theme.config.home.carousel_effect",
  enableBannerLoop: "theme.config.home.carousel_loop",
  enableBannerAutoplay: "theme.config.home.carousel_autoplay",
  enableBannerHandle: "theme.config.home.carousel_draggable",
  bannerDelay: "theme.config.home.carousel_interval",
  bannerSpeed: "theme.config.home.carousel_speed",
  enableBigBanner: "theme.config.home.hero",
  bigBannerTitle: "theme.config.home.hero_title",
  enableBigBannerHitokoto: "theme.config.home.hero_hitokoto",
  defaultAvatar: "theme.config.blogger.fallback_avatar",
  generateAvatarOpts: "theme.config.blogger.text_avatar",
  linksDefaultLogo: "theme.config.pages.links_fallback_logo",
  enableCodeTitle: "theme.config.code.title",
  enableCodeHr: "theme.config.code.title_divider",
  enableCodeMacdot: "theme.config.code.mac_dots",
  enableCodeCopy: "theme.config.code.copy",
  enableCodeLineNumber: "theme.config.code.line_numbers",
  enableCodeNewline: "theme.config.code.wrap",
  enableCodeExpander: "theme.config.code.collapsible",
  enableFoldLongCode: "theme.config.code.fold_long",
  longCodeHeight: "theme.config.code.fold_height",
  showToolsWhenHover: "theme.config.code.tools_on_hover",
  enableToc: "theme.config.post.toc",
  tocDepth: "theme.config.post.toc_depth",
  enableProgressBar: "theme.config.post.progress",
  enableCopyRightText: "theme.config.post.copy_notice",
  copyRightText: "theme.config.post.copy_notice_text",
  journalBlockHeight: "theme.config.pages.moments_max_height",
  enableLinksRandom: "theme.config.pages.links_random",
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
  pageTransition: "none" | "native" | "swup";
  swupPreload: boolean;
  cursorEffect: string;
  backdrop: string;
  enableContextMenu: boolean;
  enableOffscreenTip: boolean;
  offscreenTitleLeave: string;
  offscreenTitleBack: string;
  enableCleanMode: boolean;
  enableConsoleTheme: boolean;
  enableDebug: boolean;
  showLoadedTime: boolean;
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
  };
  post: {
    toc: boolean;
    tocDepth: number;
    progressBar: boolean;
    copyRightText: string;
  };
  journal: { blockHeight: number };
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
    cursorEffect: toStr(raw.cursorEffect, "off"),
    backdrop: toStr(raw.backdrop, "off"),
    enableContextMenu: toBool(raw.enableContextMenu),
    enableOffscreenTip: toBool(raw.enableOffscreenTip),
    offscreenTitleLeave: toStr(raw.offscreenTitleLeave),
    offscreenTitleBack: toStr(raw.offscreenTitleBack),
    enableCleanMode: toBool(raw.enableCleanMode),
    enableConsoleTheme: toBool(raw.enableConsoleTheme),
    enableDebug: toBool(raw.enableDebug),
    showLoadedTime: toBool(raw.showLoadedTime),
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
      blockHeight: toNumber(raw.journalBlockHeight, 300),
    },
    enableLinksRandom: toBool(raw.enableLinksRandom),
    siteTitle: toStr(raw.siteTitle),
    version: toStr(raw.version, "0.0.0"),
    assetsBase: assetsBase.replace(/\/$/, ""),
  };
}

export const CONFIG_ELEMENT_ID = "joe-config";
