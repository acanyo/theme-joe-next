/** 编辑器空段落和插件注入的样式不应产生一张空白故事卡片。 */
export function hideEmptyAboutStory(root: HTMLElement): void {
  const story = root.querySelector<HTMLElement>("#about-story");
  const content = story?.querySelector<HTMLElement>("#post-inner");
  if (!story || !content || story.querySelector(".joe_about__photo")) return;
  const copy = content.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll("style, script, template")
    .forEach((element) => element.remove());
  if (
    copy.textContent?.trim() ||
    copy.querySelector(
      "img, video, audio, iframe, object, table, pre, svg, canvas, hr",
    )
  )
    return;
  story.hidden = true;
  root
    .querySelectorAll<HTMLAnchorElement>('a[href="#about-story"]')
    .forEach((link) => {
      link.hidden = true;
    });
}
