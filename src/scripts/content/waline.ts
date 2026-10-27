/**
 * Waline 评论（可选）。仅在设置选择 Waline 且页面存在挂载点时按需加载。
 * 服务端配置通过 data 属性传入，不再依赖内联模块脚本和 CDN 地址。
 */
import { $$ } from "../core/dom";
import { loadStylesheet } from "../core/stylesheet";
import walineCss from "@waline/client/style?url";

declare global {
  interface Window {
    __JOE_WALINE__?: {
      serverURL: string;
      options?: string;
      imageUploader?: "default" | "lskypro";
      lskypro?: { apiURL?: string; token?: string };
    };
  }
}

function parseOptions(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn("[joe-next] Waline 基础配置不是合法 JSON，已忽略");
    return {};
  }
}

function lskyproUploader(apiURL: string, token: string) {
  return async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("file", file);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(apiURL, { method: "POST", headers, body });
    const json = (await res.json()) as { data: { links: { url: string } } };
    return json.data.links.url;
  };
}

export async function initWaline(): Promise<void> {
  const targets = $$("[data-joe-waline]");
  const config = window.__JOE_WALINE__;
  if (!targets.length || !config?.serverURL) return;
  const [{ init }] = await Promise.all([
    import("@waline/client"),
    loadStylesheet(walineCss),
  ]);
  const options = parseOptions(config.options);
  for (const el of targets) mount(init, el, config, options);
}

function mount(
  init: typeof import("@waline/client").init,
  el: HTMLElement,
  config: NonNullable<Window["__JOE_WALINE__"]>,
  options: Record<string, unknown>,
): void {
  init({
    el,
    serverURL: config.serverURL,
    path: el.dataset.path || location.pathname,
    dark: 'html[data-mode="dark"]',
    requiredMeta: ["nick", "mail"],
    ...(config.imageUploader === "lskypro" && config.lskypro?.apiURL
      ? {
          imageUploader: lskyproUploader(
            config.lskypro.apiURL,
            config.lskypro.token ?? "",
          ),
        }
      : {}),
    ...options,
  });
}

/** 列表页 / 文章元信息中的评论数 */
export async function initWalineCount(): Promise<void> {
  const config = window.__JOE_WALINE__;
  if (!config?.serverURL || !document.querySelector(".waline-comment-count"))
    return;
  const { commentCount } = await import("@waline/client");
  commentCount({
    serverURL: config.serverURL,
    selector: ".waline-comment-count",
  });
}
