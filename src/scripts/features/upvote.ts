/**
 * 点赞（Halo 公开 upvote tracker）。文章、页面、瞬间共用。
 * 本地记录已点赞的内容，避免重复计数。
 */
import { getWithExpiry, setWithExpiry } from "../core/storage";
import { notify } from "../core/toast";

export interface UpvoteTarget {
  group: string;
  plural: string;
  name: string;
}

const storageKey = (plural: string) => `joe-next:liked:${plural}`;

export function hasUpvoted({ plural, name }: UpvoteTarget): boolean {
  return (getWithExpiry<string[]>(storageKey(plural)) ?? []).includes(name);
}

export async function upvote(target: UpvoteTarget): Promise<boolean> {
  if (hasUpvoted(target)) {
    notify.info("您已经点过赞了");
    return false;
  }
  try {
    const res = await fetch("/apis/api.halo.run/v1alpha1/trackers/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    notify.error("点赞失败，请稍后再试");
    return false;
  }
  const key = storageKey(target.plural);
  setWithExpiry(
    key,
    [...(getWithExpiry<string[]>(key) ?? []), target.name],
    60 * 24 * 365,
  );
  return true;
}

/**
 * 绑定点赞按钮。按钮需包含 `.nums` 计数元素，可选 `.icon-like` / `.icon-unlike` 图标。
 */
export function bindUpvoteButton(
  button: HTMLElement,
  target: UpvoteTarget,
): void {
  const counter = button.querySelector<HTMLElement>(".nums");
  const render = () => {
    const active = hasUpvoted(target);
    button.classList.toggle("active", active);
    button.querySelector(".icon-like")?.classList.toggle("active", !active);
    button.querySelector(".icon-unlike")?.classList.toggle("active", active);
  };
  render();
  let busy = false;
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (busy) return;
    busy = true;
    if (await upvote(target)) {
      if (counter)
        counter.textContent = String(Number(counter.textContent || 0) + 1);
      render();
      notify.success("感谢您的点赞");
    }
    busy = false;
  });
}
