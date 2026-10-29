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
    // 收款码在透明的弹层里，懒加载要等悬停才开始下载，弹出时会先空白一下：栏显示后提前加载
    if (show) $$<HTMLImageElement>(".post-operate-donate img[loading=lazy]", rail).forEach((img) => (img.loading = "eager"));
  };
  update();
  listen(window, "resize", throttle(update, 200));

  // 顶部与文章卡片对齐，滚动后停在导航栏下方；滚过文章区域（进入页脚）时淡出，不压在页脚上
  const follow = () => {
    const { top, bottom } = post.getBoundingClientRect();
    rail.style.top = `${Math.round(Math.max(headerOffset() + 20, top))}px`;
    rail.classList.toggle("is-past", bottom < rail.getBoundingClientRect().bottom + 40);
  };
  follow();
  listen(window, "scroll", throttle(follow, 100), { passive: true });
}
