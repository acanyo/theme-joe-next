/**
 * 评论区增强（components/post/CommentSection.astro）：
 * - 问候：登录用户 / 评论组件记住的访客，在评论框上方看到「欢迎回来」与 Ta 在本站的评论数
 * - 热评：服务端输出点赞 ≥ 1 的评论，这里按点赞数排序并保留前 3 条
 * - 表情面板强调色：评论组件只接受「r, g, b」形式的变量，按当前主题色换算
 */
import { $, $$ } from "../core/dom";
import { commentIdentity } from "./visitor";

const HOT_MAX = 3;

function sortHotComments(): void {
  const list = $("[data-joe-hot-comments]");
  if (!list) return;
  const items = $$<HTMLElement>(":scope > li", list).sort(
    (a, b) => Number(b.dataset.upvote) - Number(a.dataset.upvote),
  );
  items.forEach((li, i) => (i < HOT_MAX ? list.appendChild(li) : li.remove()));
}

/** 把任意 CSS 颜色换成「r, g, b」（借助浏览器解析），失败返回 null */
function rgbTriplet(color: string): string | null {
  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g);
  probe.remove();
  return rgb && rgb.length >= 3 ? rgb.slice(0, 3).map((n) => Math.round(Number(n))).join(", ") : null;
}

function syncEmojiAccent(box: HTMLElement): void {
  const accent = getComputedStyle(box).getPropertyValue("--theme").trim();
  const rgb = accent && rgbTriplet(accent);
  if (rgb) box.style.setProperty("--halo-cw-emoji-picker-rgb-accent", rgb);
}

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
  sortHotComments();
  syncEmojiAccent(box);
  document.addEventListener("joe:color-mode", () => syncEmojiAccent(box));
  void greet(box);
}
