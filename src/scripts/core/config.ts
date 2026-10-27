/**
 * 读取服务端注入的主题配置（见 components/head/ConfigScript.astro）。
 * 结果缓存为单例，所有模块共享同一份规范化后的配置。
 */
import {
  normalizeThemeConfig,
  type RawThemeConfig,
  type ThemeConfig,
} from "../../config/theme-config";

declare global {
  interface Window {
    __JOE_CONFIG__?: { raw: RawThemeConfig; assetsBase: string };
  }
}

let cached: ThemeConfig | undefined;

export function getThemeConfig(): ThemeConfig {
  if (!cached) {
    const injected = window.__JOE_CONFIG__;
    cached = normalizeThemeConfig(
      injected?.raw ?? ({} as RawThemeConfig),
      injected?.assetsBase ?? "/",
    );
  }
  return cached;
}

/** 拼接主题静态资源地址 */
export function assetUrl(path: string): string {
  return `${getThemeConfig().assetsBase}/${path.replace(/^\//, "")}`;
}
