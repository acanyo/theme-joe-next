/**
 * 「评论后可见」：已登录用户评论过当前文章/页面后移除遮罩。
 *
 * 判断方式：Halo 公开评论接口不返回评论者用户名，但会返回邮箱的 SHA-256（spec.owner.annotations["email-hash"]）。
 * 取当前用户邮箱计算同样的哈希进行比对，比 Joe3 按昵称比对更准确。
 * 评论组件提交成功后不会通知主题，这里在用户点击评论区后轮询一段时间。
 */
import { $, headerOffset } from "../core/dom";

const COMMENTS_API = "/apis/api.halo.run/v1alpha1/comments";
const CURRENT_USER_API = "/apis/api.console.halo.run/v1alpha1/users/-";
const POLL_INTERVAL = 4000;
const POLL_DURATION = 10 * 60_000;

interface CommentPage {
  items: { spec: { owner: { annotations?: Record<string, string> } } }[];
  hasNext: boolean;
}

async function sha256(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function currentUserEmailHash(): Promise<string | null> {
  try {
    const res = await fetch(CURRENT_USER_API, { credentials: "same-origin" });
    if (!res.ok) return null;
    const email = (
      (await res.json()) as { user?: { spec?: { email?: string } } }
    ).user?.spec?.email;
    return email ? sha256(email.trim().toLowerCase()) : null;
  } catch {
    return null;
  }
}

async function hasCommented(
  kind: string,
  name: string,
  emailHash: string,
): Promise<boolean> {
  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({
      group: "content.halo.run",
      version: "v1alpha1",
      kind,
      name,
      page: String(page),
      size: "50",
    });
    const res = await fetch(`${COMMENTS_API}?${params}`);
    if (!res.ok) return false;
    const data = (await res.json()) as CommentPage;
    if (
      data.items.some(
        (item) => item.spec.owner.annotations?.["email-hash"] === emailHash,
      )
    )
      return true;
    if (!data.hasNext) return false;
  }
  return false;
}

function unlock(mask: HTMLElement): void {
  mask.closest(".joe_detail__article")?.classList.remove("limited");
  mask.remove();
}

function scrollToComments(): void {
  const comment = $(".joe_comment");
  if (comment)
    window.scrollTo({
      top:
        comment.getBoundingClientRect().top + window.scrollY - headerOffset(),
      behavior: "smooth",
    });
}

export async function initReadLimit(): Promise<void> {
  const mask = $("[data-joe-read-limit]");
  if (!mask) return;
  $("[data-joe-goto-comment]", mask)?.addEventListener(
    "click",
    scrollToComments,
  );

  // 文章本身不足一屏时没有遮挡意义
  const article = mask.closest<HTMLElement>(".joe_detail__article");
  const content = $("#post-inner", article ?? document);
  if (content && content.scrollHeight < window.innerHeight + 180) {
    unlock(mask);
    return;
  }

  if (mask.dataset.user === "anonymousUser") return;
  const emailHash = await currentUserEmailHash();
  if (!emailHash) return;
  const { kind = "Post", name = "" } = mask.dataset;
  if (await hasCommented(kind, name, emailHash)) {
    unlock(mask);
    return;
  }

  // 等待用户在评论区提交评论：进入评论区后开始轮询（待审核的评论对作者本人可见，提交后即可解锁）
  const comment = $(".joe_comment");
  if (!comment) return;
  let timer: ReturnType<typeof setInterval> | undefined;
  const startPolling = () => {
    if (timer) return;
    const deadline = Date.now() + POLL_DURATION;
    timer = setInterval(async () => {
      if (Date.now() > deadline) return clearInterval(timer);
      if (await hasCommented(kind, name, emailHash)) {
        clearInterval(timer);
        unlock(mask);
      }
    }, POLL_INTERVAL);
  };
  comment.addEventListener("focusin", startPolling, { once: true });
  comment.addEventListener("pointerdown", startPolling, { once: true });
}
