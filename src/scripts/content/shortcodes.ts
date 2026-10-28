/**
 * 文章内容短代码（Joe 编辑器插入的 <joe-*> 自定义元素）。
 *
 * 由 Joe3 的 custom.js 移植，去除 jQuery / ClipboardJS / Qmsg 依赖。
 * 只有页面中出现对应标签时才会注册，未使用短代码的页面不承担任何开销。
 * 属性值来自文章作者，渲染时一律转义，避免把属性当作 HTML 注入。
 */
import { copyText } from "../core/clipboard";
import { escapeHtml, parseItems, safeUrl } from "./shortcode-parse";

const attr = (el: Element, name: string, fallback = ""): string =>
  el.getAttribute(name) ?? fallback;
const safe = (el: Element, name: string, fallback = ""): string =>
  escapeHtml(attr(el, name, fallback));
/** CSS 颜色/尺寸等只允许常见字符，防止注入额外样式 */
const cssValue = (el: Element, name: string, fallback: string): string => {
  const value = attr(el, name, fallback);
  return /^[#\w\s.,%()+-]+$/.test(value) ? value : fallback;
};
const oneOf = <T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T =>
  (allowed as readonly string[]).includes(value ?? "")
    ? (value as T)
    : fallback;

/** 编辑器把块级短代码的正文放在 <span class="_temp|_tpl"> 中 */
function templateContent(el: Element): string {
  const tpl = Array.from(el.children).find(
    (child) =>
      child.classList.contains("_temp") || child.classList.contains("_tpl"),
  );
  const html = tpl?.innerHTML.trim().replace(/^(<br>)|(<br>)$/g, "") ?? "";
  tpl?.remove();
  return html;
}

function renderBlock(el: Element, html: string): void {
  let host = Array.from(el.children).find((child) =>
    child.classList.contains("_content"),
  ) as HTMLElement | undefined;
  if (!host) {
    host = document.createElement("span");
    host.className = "_content";
    host.style.display = "block";
    el.appendChild(host);
  }
  host.innerHTML = html;
}

const CLOUD_TYPES: Record<string, string> = {
  default: "默认网盘",
  360: "360网盘",
  bd: "百度网盘",
  ty: "天翼网盘",
  ct: "城通网盘",
  wy: "微云网盘",
  github: "Github仓库",
  gitee: "Gitee仓库",
  lz: "蓝奏云网盘",
  ad: "阿里云盘",
};

const COLLAPSE_ICON =
  '<svg class="joe_collapse__item-head--icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.406 7.828L12 12.422l4.594-4.594L18 9.234l-6 6-6-6z"/></svg>';

const SHORTCODES: Record<string, (el: HTMLElement) => void | Promise<void>> = {
  "joe-mtitle": (el) => {
    el.innerHTML = `<span class="joe_mtitle"><span class="joe_mtitle__text">${safe(el, "title", "默认标题")}</span></span>`;
  },
  "joe-abtn": (el) => {
    el.innerHTML = `<a class="joe_abtn" style="background:${cssValue(el, "color", "#ff6800")};border-radius:${cssValue(el, "radius", "17.5px")}" href="${safeUrl(attr(el, "href"))}" target="_blank" rel="noopener noreferrer nofollow"><span class="joe_abtn__icon"><i class="${safe(el, "icon")}"></i></span><span class="joe_abtn__content">${safe(el, "content", "多彩按钮")}</span></a>`;
  },
  "joe-anote": (el) => {
    const type = oneOf(
      el.getAttribute("type"),
      ["secondary", "success", "warning", "error", "info"],
      "secondary",
    );
    el.innerHTML = `<a class="joe_anote ${type}" href="${safeUrl(attr(el, "href"))}" target="_blank" rel="noopener noreferrer nofollow"><span class="joe_anote__icon"><i class="joe-font joe-icon-download"></i></span><span class="joe_anote__content">${safe(el, "content", "标签按钮")}</span></a>`;
  },
  "joe-dotted": (el) => {
    const start = cssValue(el, "startColor", "#ff6c6c");
    const end = cssValue(el, "endColor", "#1989fa");
    el.innerHTML = `<span class="joe_dotted" style="background-image:repeating-linear-gradient(-45deg,${start} 0,${start} 20%,transparent 0,transparent 25%,${end} 0,${end} 45%,transparent 0,transparent 50%)"></span>`;
  },
  "joe-cloud": (el) => {
    const type = attr(el, "type", "default");
    const password = attr(el, "password");
    el.innerHTML = `<span class="joe_cloud"><div class="joe_cloud__logo _${escapeHtml(type)}"></div><div class="joe_cloud__describe"><div class="joe_cloud__describe-title">${safe(el, "title", "默认标题")}</div><div class="joe_cloud__describe-type">来源：${CLOUD_TYPES[type] ?? "默认网盘"}${password ? ` | 提取码：${escapeHtml(password)}` : ""}</div></div><a class="joe_cloud__btn" href="${safeUrl(attr(el, "url"))}" target="_blank" rel="noopener noreferrer nofollow" aria-label="下载"><i class="joe-font joe-icon-download"></i></a></span>`;
  },
  "joe-message": (el) => {
    const type = oneOf(
      el.getAttribute("type"),
      ["success", "info", "warning", "error"],
      "info",
    );
    el.innerHTML = `<span class="joe_message ${type}"><span class="joe_message__icon"></span><span class="joe_message__content">${safe(el, "content", "消息内容")}</span></span>`;
  },
  "joe-progress": (el) => {
    const percent = /^\d{1,3}%$/.test(attr(el, "percentage"))
      ? attr(el, "percentage")
      : "50%";
    el.innerHTML = `<span class="joe_progress"><div class="joe_progress__strip"><div class="joe_progress__strip-percent" style="width:${percent};background:${cssValue(el, "color", "#ff6c6c")}"></div></div><div class="joe_progress__percentage">${percent}</div></span>`;
  },
  "joe-card-default": (el) => {
    renderBlock(
      el,
      `<div class="joe_card__default" style="width:${cssValue(el, "width", "100%")}"><div class="joe_card__default-title">${safe(el, "label", "卡片标题")}</div><div class="joe_card__default-content">${templateContent(el) || "卡片内容"}</div></div>`,
    );
  },
  "joe-callout": (el) => {
    renderBlock(
      el,
      `<div class="joe_callout" style="border-left-color:${cssValue(el, "color", "#f0ad4e")}">${templateContent(el) || "标注内容"}</div>`,
    );
  },
  "joe-card-describe": (el) => {
    renderBlock(
      el,
      `<div class="joe_card__describe"><div class="joe_card__describe-title">${safe(el, "title", "卡片描述")}</div><div class="joe_card__describe-content">${templateContent(el) || "卡片内容"}</div></div>`,
    );
  },
  "joe-alert": (el) => {
    const type = oneOf(
      el.getAttribute("type"),
      ["success", "info", "warning", "error"],
      "info",
    );
    renderBlock(
      el,
      `<div class="joe_alert ${type}">${templateContent(el) || "警告提示"}</div>`,
    );
  },
  "joe-card-list": (el) => {
    const items = parseItems(templateContent(el), "card-list-item");
    renderBlock(
      el,
      `<div class="joe_card__list">${items.map((i) => `<div class="joe_card__list-item">${i.content}</div>`).join("")}</div>`,
    );
  },
  "joe-timeline": (el) => {
    const items = parseItems(templateContent(el), "timeline-item");
    renderBlock(
      el,
      `<div class="joe_timeline">${items
        .map(
          (i) =>
            `<div class="joe_timeline__item"><div class="joe_timeline__item-tail"></div><div class="joe_timeline__item-circle" style="border-color:${/^[#\w]+$/.test(i.attrs.color ?? "") ? i.attrs.color : "#19be6b"}"></div><div class="joe_timeline__item-content">${i.content}</div></div>`,
        )
        .join("")}</div>`,
    );
  },
  "joe-gird": (el) => {
    const column = Number(attr(el, "column")) || 3;
    const gap = Number(attr(el, "gap")) || 15;
    const items = parseItems(templateContent(el), "gird-item");
    renderBlock(
      el,
      `<div class="joe_gird" style="gap:${gap}px;grid-template-columns:repeat(${column},1fr)">${items.map((i) => `<div class="joe_gird__item">${i.content}</div>`).join("")}</div>`,
    );
  },
  "joe-collapse": (el) => {
    const items = parseItems(templateContent(el), "collapse-item");
    renderBlock(
      el,
      `<div class="joe_collapse">${items
        .map(
          (i) =>
            `<div class="joe_collapse__item${"open" in i.attrs ? " active" : ""}"><button type="button" class="joe_collapse__item-head"><div class="joe_collapse__item-head--label">${escapeHtml(i.attrs.label ?? "折叠标题")}</div>${COLLAPSE_ICON}</button><div class="joe_collapse__item-wrapper"${"open" in i.attrs ? ' style="max-height:none"' : ""}><div class="joe_collapse__item-wrapper--content">${i.content}</div></div></div>`,
        )
        .join("")}</div>`,
    );
    el.querySelectorAll<HTMLElement>(".joe_collapse__item").forEach((item) => {
      const wrapper = item.querySelector<HTMLElement>(
        ".joe_collapse__item-wrapper",
      );
      const content = item.querySelector<HTMLElement>(
        ".joe_collapse__item-wrapper--content",
      );
      item
        .querySelector(".joe_collapse__item-head")
        ?.addEventListener("click", () => {
          if (!wrapper || !content) return;
          wrapper.style.maxHeight = `${content.offsetHeight}px`;
          requestAnimationFrame(() => {
            const open = item.classList.toggle("active");
            wrapper.style.maxHeight = open ? `${content.offsetHeight}px` : "0";
          });
        });
    });
  },
  "joe-tabs": (el) => {
    const panes = parseItems(templateContent(el), "tabs-pane");
    renderBlock(
      el,
      `<div class="joe_tabs"><div class="joe_tabs__head" role="tablist">${panes
        .map(
          (p, i) =>
            `<button type="button" role="tab" class="joe_tabs__head-item${i === 0 ? " active" : ""}" data-index="${i}">${escapeHtml(p.attrs.label ?? `标签 ${i + 1}`)}</button>`,
        )
        .join("")}</div><div class="joe_tabs__body">${panes
        .map(
          (p, i) =>
            `<div class="joe_tabs__body-item" role="tabpanel" data-index="${i}"${i === 0 ? "" : ' style="display:none"'}>${p.content}</div>`,
        )
        .join("")}</div></div>`,
    );
    el.querySelectorAll<HTMLElement>(".joe_tabs__head-item").forEach((tab) =>
      tab.addEventListener("click", () => {
        el.querySelectorAll(".joe_tabs__head-item").forEach((t) =>
          t.classList.toggle("active", t === tab),
        );
        el.querySelectorAll<HTMLElement>(".joe_tabs__body-item").forEach(
          (body) =>
            (body.style.display =
              body.dataset.index === tab.dataset.index ? "" : "none"),
        );
      }),
    );
  },
  "joe-copy": (el) => {
    el.innerHTML = `<button type="button" class="joe_copy" style="font-weight:${el.hasAttribute("bold") ? "bold" : "normal"};color:${cssValue(el, "color", "inherit")}">${safe(el, "title", "点击复制")}</button>`;
    el.querySelector("button")?.addEventListener(
      "click",
      () => void copyText(attr(el, "content", "默认文本")),
    );
  },
  "joe-copy-icon": (el) => {
    el.innerHTML = `<button type="button" class="joe_copy">${safe(el, "title")}<i class="${safe(el, "icon", "joe-font joe-icon-copy")}" aria-hidden="true"></i></button>`;
    el.querySelector("button")?.addEventListener(
      "click",
      () => void copyText(attr(el, "content", "默认文本")),
    );
  },
  "joe-bilibili": (el) => {
    const bvid = attr(el, "bvid");
    if (!/^BV\w+$/i.test(bvid)) {
      el.textContent = "bvid 未填写或格式不正确";
      return;
    }
    const page = Number(attr(el, "page", "1")) || 1;
    el.innerHTML = `<iframe class="joe_vplayer" allowfullscreen loading="lazy" src="https://player.bilibili.com/player.html?bvid=${bvid}&page=${page}&autoplay=0" style="width:${cssValue(el, "width", "100%")};height:${cssValue(el, "height", "500px")}"></iframe>`;
  },
  "joe-dplayer": async (el) => {
    const src = attr(el, "src");
    if (!src) {
      el.textContent = "视频地址未填写！";
      return;
    }
    const video = document.createElement("video");
    video.className = "joe_vplayer";
    video.controls = true;
    video.preload = "metadata";
    video.style.cssText = `width:${cssValue(el, "width", "100%")};max-height:${cssValue(el, "height", "500px")};background:#000`;
    el.replaceChildren(video);
    if (
      /\.m3u8(\?|$)/i.test(src) &&
      !video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      const { default: Hls } = await import("hls.js/light");
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        return;
      }
    }
    video.src = src;
  },
  /** 音频：原生 <audio> 播放 */
  "joe-mp3": (el) => {
    const url = attr(el, "url").trim();
    if (!url) {
      el.textContent = "音频地址未填写！";
      return;
    }
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = url;
    audio.className = "joe_audio";
    const name = attr(el, "name");
    if (name) audio.setAttribute("aria-label", name);
    el.replaceChildren(audio);
  },
  /** 网易云单曲 / 歌单：主题不再内置播放器，改为指向网易云的链接 */
  "joe-music": (el) => renderNeteaseLink(el, "song"),
  "joe-mlist": (el) => renderNeteaseLink(el, "playlist"),
};

function renderNeteaseLink(el: HTMLElement, type: "song" | "playlist"): void {
  const id = attr(el, "id");
  if (!/^\d+$/.test(id)) {
    el.textContent = "网易云 ID 未填写！";
    return;
  }
  const link = document.createElement("a");
  link.href = `https://music.163.com/#/${type}?id=${id}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = type === "song" ? "在网易云音乐中收听" : "在网易云音乐中打开歌单";
  el.replaceChildren(link);
}

export function initShortcodes(root: ParentNode = document): void {
  for (const [tag, render] of Object.entries(SHORTCODES)) {
    root.querySelectorAll<HTMLElement>(tag).forEach((el) => {
      if (el.dataset.joeRendered) return;
      el.dataset.joeRendered = "true";
      Promise.resolve(render(el)).catch((error) =>
        console.warn(`[joe-next] 短代码 <${tag}> 渲染失败`, error),
      );
    });
  }
  root
    .querySelectorAll(".joe_detail__article p:empty")
    .forEach((p) => p.remove());
}
