/** 正文图片灯箱（PhotoSwipe 5，替代 fancybox），首次点击时才加载 */
import { $$ } from "../core/dom";
import { loadStylesheet } from "../core/stylesheet";
import photoswipeCss from "photoswipe/style.css?url";
import { addPhotoInfo } from "./exif";

const SELECTOR =
  ".joe_detail__article img:not([class]), .joe_journal_body img:not([class])";

export function initGallery(selector = SELECTOR): void {
  const images = $$<HTMLImageElement>(selector).filter(
    (img) => !img.closest("a"),
  );
  if (!images.length) return;
  images.forEach((img) => (img.style.cursor = "zoom-in"));

  let lightbox: { loadAndOpen: (index: number) => void } | undefined;
  const open = async (index: number) => {
    if (!lightbox) {
      const [{ default: PhotoSwipeLightbox }] = await Promise.all([
        import("photoswipe/lightbox"),
        loadStylesheet(photoswipeCss),
      ]);
      const instance = new PhotoSwipeLightbox({
        dataSource: images.map((img) => ({
          src: img.currentSrc || img.src,
          // Halo 生成的缩略图（srcset）不保留 EXIF：照片信息从原图地址读取
          exifSrc: img.getAttribute("src") || img.src,
          width: img.naturalWidth || 1200,
          height: img.naturalHeight || 800,
          alt: img.alt,
        })),
        pswpModule: () => import("photoswipe"),
        bgOpacity: 0.9,
      });
      addPhotoInfo(instance);
      instance.init();
      lightbox = instance;
    }
    lightbox.loadAndOpen(index);
  };
  images.forEach((img, index) =>
    img.addEventListener("click", () => void open(index)),
  );
}
