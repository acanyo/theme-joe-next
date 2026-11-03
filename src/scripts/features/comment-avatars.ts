/** 为模板输出的评论头像复用文章列表的解析规则，在默认图片回退之前执行。 */
import { commentAvatar } from "./commenters-core";

export function fillCommentAvatars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>("img[data-comment-avatar]").forEach((img) => {
    if ((img.getAttribute("src") ?? "").trim()) return;
    const avatar = commentAvatar({
      owner: { kind: img.dataset.ownerKind },
      spec: { owner: { annotations: { "email-hash": img.dataset.emailHash ?? "" } } },
    });
    if (avatar) img.src = avatar;
  });
}
