/**
 * 分享海报（components/post/ShareLinks.astro 的「生成分享海报」按钮，设置 share.poster）。
 *
 * 在浏览器里用 canvas 画一张 750px 宽的竖版图片：封面、分类、标题、摘要、作者与日期、文章二维码、站点名。
 * 二维码用已有的 qrcode 依赖本地生成，不请求任何外部服务。
 * 封面是其他域名的图片且对方不允许跨域读取时，canvas 无法导出，此时改用主题色渐变代替封面。
 * 生成后在弹窗里预览，可保存图片、复制图片（浏览器支持时）或用系统分享（移动端）。
 */
import { iconHtml } from "../core/icons";
import { onCleanup } from "../core/lifecycle";
import { notify } from "../core/toast";

interface PosterData {
  url: string;
  title: string;
  excerpt: string;
  cover: string;
  author: string;
  avatar: string;
  date: string;
  site: string;
  category: string;
}

const WIDTH = 750;
const PAD = 48;
const COVER_H = 420;
/** 各段高度：绘制与计算画布高度共用，避免两边对不上把底部裁掉 */
const TITLE_TOP = 56, TITLE_LINE = 60, EXCERPT_GAP = 24, EXCERPT_LINE = 42;
const META_TOP = 28, AVATAR = 44, META_BOTTOM = 36;
const QR = 150, QR_TOP = 34, BOTTOM_PAD = 48;
const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif';

function readData(el: HTMLElement): PosterData {
  const d = el.dataset;
  return {
    url: d.url || location.href,
    title: d.title || document.title,
    excerpt: (d.excerpt || "").replace(/\s+/g, " ").trim(),
    cover: d.cover || "",
    author: d.author || "",
    avatar: d.avatar || "",
    date: d.date || "",
    site: d.site || location.hostname,
    category: d.category || "",
  };
}

/** 读取当前主题色（CSS 变量 --theme），画渐变与强调色用 */
function accent(): string {
  return getComputedStyle(document.body).getPropertyValue("--theme").trim() || "#fb6c28";
}

/** 加载可用于 canvas 导出的图片；跨域不允许或加载失败时返回 null */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = new URL(src, location.href).href;
  });
}

/** 按宽度把文字拆成多行，超出 maxLines 时最后一行加省略号（中文按字、英文按词） */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const tokens = text.match(/[⺀-鿿豈-﫿＀-￯]|[^\s⺀-鿿豈-﫿＀-￯]+|\s+/g) ?? [];
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    // 句末标点（。，、！？）不放到行首：允许挤在上一行末尾
    if (ctx.measureText(next).width <= width || !line || /^[。，、；：！？）》」』”’.,;:!?)]$/.test(token)) {
      line = next;
      continue;
    }
    lines.push(line.trimEnd());
    line = token.trimStart();
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line.trimEnd());
  else if (lines.length === maxLines && line) {
    let last = lines[maxLines - 1]!;
    while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

/** 以 cover 方式把图片画进矩形 */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

async function render(data: PosterData): Promise<HTMLCanvasElement> {
  const [{ toCanvas }, cover, avatar] = await Promise.all([
    import("qrcode"),
    loadImage(data.cover),
    loadImage(data.avatar),
  ]);
  const color = accent();

  // 先量出标题、摘要的行数，再定画布高度
  const probe = document.createElement("canvas").getContext("2d")!;
  const textW = WIDTH - PAD * 2;
  probe.font = `700 44px ${FONT}`;
  const titleLines = wrap(probe, data.title, textW, 3);
  probe.font = `400 26px ${FONT}`;
  const excerptLines = data.excerpt ? wrap(probe, data.excerpt, textW, 4) : [];
  const height =
    COVER_H + TITLE_TOP + titleLines.length * TITLE_LINE +
    (excerptLines.length ? EXCERPT_GAP + excerptLines.length * EXCERPT_LINE : 0) +
    META_TOP + AVATAR + META_BOTTOM + QR_TOP + QR + BOTTOM_PAD;

  const ratio = 2;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);

  // 背景
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, WIDTH, height);

  // 封面：读不到时用主题色渐变
  if (cover) drawCover(ctx, cover, 0, 0, WIDTH, COVER_H);
  else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, WIDTH, COVER_H);
    // canvas 不支持 color-mix()：在主题色上叠一层白色渐变，做出由深到浅的效果
    const g = ctx.createLinearGradient(0, 0, WIDTH, COVER_H);
    g.addColorStop(0, "rgb(255 255 255 / 0%)");
    g.addColorStop(1, "rgb(255 255 255 / 55%)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, COVER_H);
    ctx.fillStyle = "rgb(255 255 255 / 92%)";
    ctx.font = `700 64px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.fillText(data.site, PAD, COVER_H / 2);
  }

  // 分类标签压在封面左下角
  let y = COVER_H;
  if (data.category) {
    ctx.font = `600 22px ${FONT}`;
    const w = ctx.measureText(data.category).width + 32;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(PAD, y - 22, w, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(data.category, PAD + 16, y);
  }

  // 标题
  y += TITLE_TOP;
  ctx.fillStyle = "#1f2328";
  ctx.font = `700 44px ${FONT}`;
  ctx.textBaseline = "top";
  for (const line of titleLines) {
    ctx.fillText(line, PAD, y);
    y += TITLE_LINE;
  }

  // 摘要
  if (excerptLines.length) {
    y += EXCERPT_GAP;
    ctx.fillStyle = "#57606a";
    ctx.font = `400 26px ${FONT}`;
    for (const line of excerptLines) {
      ctx.fillText(line, PAD, y);
      y += EXCERPT_LINE;
    }
  }

  // 作者与日期
  y += META_TOP;
  const avatarSize = AVATAR;
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, avatar, PAD, y, avatarSize, avatarSize);
    ctx.restore();
  }
  const metaX = PAD + (avatar ? avatarSize + 14 : 0);
  ctx.fillStyle = "#1f2328";
  ctx.font = `600 24px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText(data.author, metaX, y + avatarSize / 2);
  if (data.date) {
    ctx.fillStyle = "#8c959f";
    ctx.font = `400 22px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(data.date, WIDTH - PAD, y + avatarSize / 2);
    ctx.textAlign = "left";
  }
  y += avatarSize + META_BOTTOM;

  // 分隔线
  ctx.strokeStyle = "#e5e7eb";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(WIDTH - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 底部：站点名 + 提示，右侧二维码
  const qrSize = QR;
  const qr = document.createElement("canvas");
  await toCanvas(qr, data.url, { width: qrSize * ratio, margin: 1, color: { dark: "#1f2328", light: "#ffffff" } });
  const qrY = y + QR_TOP;
  ctx.drawImage(qr, WIDTH - PAD - qrSize, qrY, qrSize, qrSize);

  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.fillRect(PAD, qrY + 18, 6, 34);
  ctx.fillStyle = "#1f2328";
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(data.site, PAD + 20, qrY + 18);
  ctx.fillStyle = "#8c959f";
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText("长按或扫描二维码阅读全文", PAD, qrY + 84);
  ctx.fillText(new URL(data.url).host, PAD, qrY + 118);

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch {
      // 画进了跨域图片，canvas 被污染，无法导出
      resolve(null);
    }
  });
}

function fileName(title: string): string {
  return `${title.replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 40) || "poster"}.png`;
}

/** 弹窗：预览 + 保存 / 复制 / 系统分享 */
function openDialog(): {
  dialog: HTMLDialogElement;
  show: (canvas: HTMLCanvasElement, blob: Blob, title: string) => void;
  fail: (message: string) => void;
} {
  const dialog = document.createElement("dialog");
  dialog.className = "joe_poster";
  dialog.setAttribute("aria-label", "分享海报");
  dialog.innerHTML = `
    <div class="joe_poster__body">
      <button type="button" class="joe_poster__close" aria-label="关闭">${iconHtml("close")}</button>
      <div class="joe_poster__preview" aria-live="polite"><p class="joe_poster__loading">正在生成海报…</p></div>
      <div class="joe_poster__actions" hidden>
        <a class="joe_poster__btn is-primary" data-poster="save">${iconHtml("download")}<span>保存图片</span></a>
        <button type="button" class="joe_poster__btn" data-poster="copy" hidden>${iconHtml("copy")}<span>复制图片</span></button>
        <button type="button" class="joe_poster__btn" data-poster="share" hidden>${iconHtml("share")}<span>分享</span></button>
      </div>
      <p class="joe_poster__tip" hidden>手机上可长按图片保存</p>
    </div>`;
  document.body.appendChild(dialog);
  const close = () => dialog.close();
  dialog.querySelector(".joe_poster__close")!.addEventListener("click", close);
  // 点到弹窗外面（::backdrop）关闭
  dialog.addEventListener("click", (event) => event.target === dialog && close());
  dialog.addEventListener("keydown", (event) => event.key === "Escape" && close());
  let objectUrl = "";
  dialog.addEventListener("close", () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    dialog.remove();
  });
  dialog.showModal();

  const preview = dialog.querySelector<HTMLElement>(".joe_poster__preview")!;
  const actions = dialog.querySelector<HTMLElement>(".joe_poster__actions")!;
  return {
    dialog,
    show(canvas, blob, title) {
      objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = objectUrl;
      img.alt = `「${title}」分享海报`;
      img.width = canvas.width / 2;
      img.height = canvas.height / 2;
      preview.replaceChildren(img);
      const save = actions.querySelector<HTMLAnchorElement>("[data-poster=save]")!;
      save.href = objectUrl;
      save.download = fileName(title);
      const file = new File([blob], fileName(title), { type: "image/png" });
      const copy = actions.querySelector<HTMLButtonElement>("[data-poster=copy]")!;
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write && window.isSecureContext) {
        copy.hidden = false;
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            notify.success("海报已复制，可以直接粘贴发送");
          } catch {
            notify.error("复制失败，请保存图片后发送");
          }
        });
      }
      const share = actions.querySelector<HTMLButtonElement>("[data-poster=share]")!;
      if (navigator.canShare?.({ files: [file] })) {
        share.hidden = false;
        share.addEventListener("click", () => void navigator.share({ files: [file], title }).catch(() => undefined));
      }
      actions.hidden = false;
      dialog.querySelector<HTMLElement>(".joe_poster__tip")!.hidden = !matchMedia("(pointer: coarse)").matches;
    },
    fail(message) {
      preview.innerHTML = `<p class="joe_poster__loading">${message}</p>`;
    },
  };
}

export function initPoster(): void {
  const buttons = [...document.querySelectorAll<HTMLElement>("[data-joe-share-poster]")];
  if (!buttons.length) return;
  let busy = false;
  const onClick = async (event: Event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const data = readData(event.currentTarget as HTMLElement);
    const ui = openDialog();
    try {
      let canvas = await render(data);
      let blob = await toBlob(canvas);
      // 封面跨域导致无法导出：去掉封面重画一次
      if (!blob && data.cover) {
        canvas = await render({ ...data, cover: "", avatar: "" });
        blob = await toBlob(canvas);
      }
      if (!blob) throw new Error("toBlob failed");
      if (ui.dialog.open) ui.show(canvas, blob, data.title);
    } catch (error) {
      console.error("[joe-next] 生成分享海报失败", error);
      ui.fail("海报生成失败，请稍后再试");
    } finally {
      busy = false;
    }
  };
  buttons.forEach((button) => button.addEventListener("click", (e) => void onClick(e)));
  // 无刷新切页时关掉还开着的海报
  onCleanup(() => document.querySelectorAll<HTMLDialogElement>("dialog.joe_poster").forEach((d) => d.close()));
}
