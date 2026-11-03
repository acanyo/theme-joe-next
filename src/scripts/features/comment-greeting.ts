/**
 * 评论区增强（components/post/CommentSection.astro）：
 * - 问候：登录用户 / 评论组件记住的访客，在评论框上方看到「欢迎回来」与 Ta 在本站的评论数
 */
import { $ } from "../core/dom";
import { commentIdentity } from "./visitor";

async function greet(box: HTMLElement): Promise<void> {
  const hello = $<HTMLElement>("[data-joe-comment-hello]", box);
  if (!hello) return;
  const user = $<HTMLElement>("[data-joe-comment-user]", box)?.dataset.name;
  if (user) {
    hello.textContent = `你好，${user}，以登录账号发表评论。`;
    hello.hidden = false;
    return;
  }
  const me = await commentIdentity();
  if (!me?.name) return;
  hello.textContent = `欢迎回来，${me.name}，你的昵称和邮箱已经记住了，直接写下想说的话吧。`;
  hello.hidden = false;
}

export function initCommentEnhancements(): void {
  const box = $<HTMLElement>(".joe_comment");
  if (!box) return;
  void greet(box);
}
