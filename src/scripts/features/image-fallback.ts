/**
 * 图片加载失败回退与文字头像生成（原 Joe.errorImg / loadedPlaceholderReplaceImg）。
 *
 * 模板中的 <img> 通过 data 属性声明回退策略，不再使用内联 onerror：
 *   data-fallback="thumbnail" | "avatar" | "link" | "image"
 *   data-fallback-src   优先使用的回退地址
 *   data-text-avatar    无可用回退时用于生成文字头像的文字
 */
import { assetUrl, getThemeConfig } from "../core/config";
import type { AvatarOptions } from "../../config/theme-config";

type FallbackKind = "thumbnail" | "avatar" | "link" | "image";

const PLACEHOLDER = "transparent-placeholder.png";

function randomColor(alpha: number): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/** 解析 `var(--xxx)` 为实际颜色值 */
function resolveCssColor(value: string | undefined): string | undefined {
  const match = value?.match(/var\(--([\w-]+)\)/);
  if (!match) return value;
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(`--${match[1]}`).trim() || value;
}

export function generateTextAvatar(
  text: string,
  overrides: AvatarOptions = {},
): string {
  const opts = { ...getThemeConfig().avatarOptions, ...overrides };
  const fontSize = 50;
  const size = fontSize * 1.5;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const bgColor = resolveCssColor(opts.bgColor);
  if (bgColor) {
    ctx.fillStyle = bgColor;
  } else {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, randomColor(0.7));
    gradient.addColorStop(1, randomColor(0.7));
    ctx.fillStyle = gradient;
  }
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const textColor = resolveCssColor(opts.textColor);
  if (textColor) {
    ctx.fillStyle = textColor;
  } else if (opts.useTextGradient) {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, randomColor(0.9));
    gradient.addColorStop(1, randomColor(0.9));
    ctx.fillStyle = gradient;
  } else if (bgColor) {
    ctx.fillStyle = /^(#000000|#000|black)$/i.test(bgColor) ? "#fff" : "#000";
  }
  ctx.font = `${fontSize}px "Great Vibes", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Array.from(text)[0] ?? "", size / 2, size / 2);
  return canvas.toDataURL();
}

function fallbackFor(img: HTMLImageElement, kind: FallbackKind): string {
  const config = getThemeConfig();
  const explicit = img.dataset.fallbackSrc;
  const current = img.getAttribute("src") ?? "";
  const textSource = img.dataset.textAvatar || img.alt;
  const usable = (src: string | undefined) =>
    Boolean(src) && src !== current && !current.includes(PLACEHOLDER);

  switch (kind) {
    case "thumbnail":
      return (
        explicit ||
        config.fallbackThumbnail ||
        assetUrl("images/default_thumbnail.png")
      );
    case "avatar": {
      const candidate = explicit || config.defaultAvatar;
      if (usable(candidate)) return candidate as string;
      return textSource
        ? generateTextAvatar(textSource)
        : assetUrl("images/peeps-avatar.png");
    }
    case "link": {
      const candidate = explicit || config.linksDefaultLogo;
      if (usable(candidate)) return candidate as string;
      return textSource
        ? generateTextAvatar(textSource)
        : assetUrl("images/default_links_logo.png");
    }
    default:
      return explicit || assetUrl("images/img_load_failed.jpg");
  }
}

function handleError(event: Event): void {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.fallbackApplied === "true") return;
  const kind = (img.dataset.fallback as FallbackKind | undefined) ?? "image";
  img.dataset.fallbackApplied = "true";
  const next = fallbackFor(img, kind);
  if (next && next !== img.getAttribute("src")) img.src = next;
}

/**
 * 没有地址的图片（如匿名评论者没有头像）不会触发 error 事件，直接补上回退图。
 * root 为新插入的内容（控制中心、加载更多等）时只处理其中的图片。
 */
export function fillEmptyImages(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>("img[data-fallback]").forEach((img) => {
    if (img.dataset.fallbackApplied === "true" || (img.getAttribute("src") ?? "").trim()) return;
    img.dataset.fallbackApplied = "true";
    const next = fallbackFor(img, (img.dataset.fallback as FallbackKind | undefined) ?? "image");
    if (next) img.src = next;
  });
}

/** 在捕获阶段统一监听图片错误，覆盖后续动态插入的图片 */
export function initImageFallback(): void {
  document.addEventListener("error", handleError, true);
}
