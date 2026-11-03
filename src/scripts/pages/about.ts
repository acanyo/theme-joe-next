/** 关于页保留正文图片灯箱，按当前风格初始化展示与交互。 */
import { initGallery } from "../content/gallery";
import { onCleanup } from "../core/lifecycle";
import { hideEmptyAboutStory } from "../about/story";
import { configureAboutDesign } from "../about/options";

export default async function init(): Promise<void> {
  initGallery();
  const root = document.querySelector<HTMLElement>(".joe_about");
  if (!root) return;
  const options = configureAboutDesign(root);
  hideEmptyAboutStory(root);
  let disposed = false;
  let stop: (() => void) | undefined;
  onCleanup(() => {
    disposed = true;
    stop?.();
  });
  const initMotion =
    root.dataset.style === "author"
      ? (await import("../about/author/index")).initAboutAuthor
      : (await import("../about/motion")).initAboutMotion;
  if (!disposed && root.isConnected) stop = initMotion(root, options);
}
