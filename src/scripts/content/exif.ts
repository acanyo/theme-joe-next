/**
 * 灯箱中的照片信息：打开大图时读取 EXIF（相机、镜头、焦距、光圈、快门、ISO、拍摄时间），
 * 显示在底部的一条半透明信息栏中，适合摄影类博客。
 *
 * - 解析库 exifr（lite 版，约 15 KB gzip）在灯箱首次打开时才下载
 * - 只读取 JPEG / HEIC 等带 EXIF 的原图；跨域图片需要对方允许 CORS，读不到时不显示
 * - 结果按图片地址缓存
 */

interface Exif {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  DateTimeOriginal?: Date;
}

const cache = new Map<string, Promise<string | null>>();

/** 1/250、0.5s、2s 这类快门写法 */
function shutter(t: number): string {
  if (t >= 1) return `${Math.round(t * 10) / 10}s`;
  return `1/${Math.round(1 / t)}`;
}

/** 「NIKON CORPORATION NIKON Z 6」这类厂商名重复的型号去重 */
function camera(make?: string, model?: string): string | undefined {
  if (!model) return make?.trim();
  const brand = make?.split(/\s+/)[0] ?? "";
  return brand && model.toLowerCase().startsWith(brand.toLowerCase()) ? model.trim() : `${make?.trim() ?? ""} ${model.trim()}`.trim();
}

export function formatExif(exif: Exif): string | null {
  const parts = [
    camera(exif.Make, exif.Model),
    exif.LensModel?.trim(),
    exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : undefined,
    exif.FNumber ? `ƒ/${Math.round(exif.FNumber * 10) / 10}` : undefined,
    exif.ExposureTime ? shutter(exif.ExposureTime) : undefined,
    exif.ISO ? `ISO ${exif.ISO}` : undefined,
    exif.DateTimeOriginal instanceof Date && !Number.isNaN(exif.DateTimeOriginal.getTime())
      ? exif.DateTimeOriginal.toLocaleDateString("zh-CN")
      : undefined,
  ].filter(Boolean);
  // 只有日期或只有机型时信息太少，不值得占一条
  return parts.length >= 2 ? parts.join(" · ") : null;
}

export function readExif(src: string): Promise<string | null> {
  let task = cache.get(src);
  if (!task) {
    task = import("exifr/dist/lite.esm.mjs")
      .then(({ default: exifr }) =>
        // lite 版不带标签名字典，「按标签名挑选」用不了；只开 IFD0 / EXIF 两段，体积与速度都够
        exifr.parse(src, { tiff: true, ifd0: true, exif: true, gps: false, interop: false, ifd1: false, xmp: false, icc: false, iptc: false, jfif: false }) as Promise<Exif | undefined>,
      )
      .then((exif) => (exif ? formatExif(exif) : null))
      .catch((error) => {
        console.debug("[joe-next] 读取 EXIF 失败", src, error);
        return null;
      });
    cache.set(src, task);
  }
  return task;
}

interface LightboxLike {
  on(name: "uiRegister", fn: () => void): void;
  pswp?: {
    ui?: { registerElement(el: { name: string; appendTo: "root"; order: number; onInit: (el: HTMLElement, pswp: PswpLike) => void }): void };
  };
}
interface PswpLike {
  currSlide?: { data: { src?: string; alt?: string; exifSrc?: string } };
  on(name: "change", fn: () => void): void;
}

/**
 * 给 PhotoSwipe 灯箱加上底部信息栏：图片说明（alt）+ EXIF。
 * 在 lightbox.init() 之前调用；数据项可用 exifSrc 指定读取 EXIF 的原图地址（默认 src）。
 */
export function addPhotoInfo(lightbox: LightboxLike): void {
  lightbox.on("uiRegister", () => {
    lightbox.pswp?.ui?.registerElement({
      name: "joe-photo-info",
      appendTo: "root",
      order: 9,
      onInit: (el, pswp) => {
        el.className = "joe_photo_info";
        const update = () => {
          const data = pswp.currSlide?.data;
          const alt = data?.alt?.trim() ?? "";
          el.innerHTML = "";
          if (alt) {
            const caption = document.createElement("p");
            caption.className = "caption";
            caption.textContent = alt;
            el.appendChild(caption);
          }
          el.hidden = !alt;
          const src = data?.exifSrc ?? data?.src;
          if (!src) return;
          void readExif(src).then((text) => {
            if (!text || pswp.currSlide?.data !== data) return;
            const meta = document.createElement("p");
            meta.className = "exif";
            meta.textContent = text;
            el.appendChild(meta);
            el.hidden = false;
          });
        };
        pswp.on("change", update);
        update();
      },
    });
  });
}
