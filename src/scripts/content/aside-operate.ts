/**
 * 文章左侧悬浮操作栏：文章左侧留有足够空间时显示，并隐藏正文下方重复的点赞/分享/打赏；
 * 空间不足（窄屏、侧栏在左等）时反之。
 */
import { $, $$, headerOffset, isMobile, throttle } from "../core/dom";
import { listen } from "../core/lifecycle";

/** 悬浮栏宽度 44px + 间距，文章左侧至少需要的空白 */
const MIN_GUTTER = 75;
/** 低于此宽度时侧栏折叠、布局改为单栏，悬浮栏会遮挡导航与正文 */
const MIN_VIEWPORT = 1200;
const BOTTOM_DUPLICATES =
  ".joe_detail__agree, .joe_detail__operate-share, .joe_detail__operate .joe_donate";

export function initAsideOperate(): void {
  const rail = $("[data-joe-aside-operate]");
  const post = $(".joe_post");
  if (!rail) return;

  $("[data-joe-goto-comment]", rail)?.addEventListener("click", () => {
    const comment = $(".joe_comment");
    if (comment)
      window.scrollTo({
        top:
          comment.getBoundingClientRect().top + window.scrollY - headerOffset(),
        behavior: "smooth",
      });
  });

  if (isMobile() || !post) return;
  const duplicates = $$(BOTTOM_DUPLICATES);
  const update = () => {
    const show =
      window.innerWidth > MIN_VIEWPORT &&
      post.getBoundingClientRect().left >= MIN_GUTTER;
    rail.classList.toggle("is-visible", show);
    duplicates.forEach((el) => (el.hidden = show));
  };
  update();
  listen(window, "resize", throttle(update, 200));
}
