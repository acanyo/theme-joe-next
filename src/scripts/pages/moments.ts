/** 瞬间页：内容展开、点赞、评论展开、代码高亮、图片灯箱、相对时间 */
import { $, $$ } from "../core/dom";
import { initCodeBlocks } from "../content/code-block";
import { initShortcodes } from "../content/shortcodes";
import { initGallery } from "../content/gallery";
import { bindUpvoteButton } from "../features/upvote";
import { timeAgo } from "../core/time";

function initItems(): void {
  $$<HTMLElement>(".joe_journal__item").forEach((item) => {
    const name = item.dataset.cid ?? "";
    const body = $(".joe_journal_body", item);
    const content = $(".content-wrp", item);
    const expander = $(".journal_content_expander", item);
    // 内容未超出最大高度时不需要展开按钮
    if (
      body &&
      content &&
      expander &&
      content.scrollHeight <= body.clientHeight
    )
      expander.hidden = true;
    expander?.addEventListener("click", () => body?.classList.toggle("open"));

    const like = $("[data-joe-moment-like]", item);
    if (like)
      bindUpvoteButton(like, {
        group: "moment.halo.run",
        plural: "moments",
        name,
      });

    $("[data-joe-moment-comment]", item)?.addEventListener("click", () => {
      $(".footer-wrap", item)?.classList.toggle("open");
    });

    const time = $<HTMLTimeElement>(".joe_journal-posttime", item);
    if (time?.dateTime) time.textContent = timeAgo(new Date(time.dateTime));
  });
}

export default function init(): void {
  initShortcodes();
  initItems();
  initGallery(".joe_journal_body img");
  initCodeBlocks({ foldLong: false });
}
