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
 * 绑定同一内容的一组点赞按钮（如正文下方与悬浮栏），点赞后所有按钮的状态与计数同步更新。
 * 按钮需包含 `.nums` 计数元素，可选 `.icon-like` / `.icon-unlike` 图标。
 */
export function bindUpvoteButtons(
  buttons: HTMLElement[],
  target: UpvoteTarget,
): void {
  const render = () => {
    const active = hasUpvoted(target);
    for (const button of buttons) {
      button.classList.toggle("active", active);
      button.querySelector(".icon-like")?.classList.toggle("active", !active);
      button.querySelector(".icon-unlike")?.classList.toggle("active", active);
      // 每个浏览器只能点一次：点过后提示文字（悬浮栏的提示取自 aria-label）改为「已点赞」
      button.setAttribute("aria-label", active ? "已点赞" : "点赞");
      button.setAttribute("aria-pressed", String(active));
    }
  };
  const increment = () => {
    for (const button of buttons) {
      const counter = button.querySelector<HTMLElement>(".nums");
      if (!counter) continue;
      counter.textContent = String(Number(counter.textContent || 0) + 1);
      counter.classList.add("visible");
    }
  };
  render();
  let busy = false;
  const onClick = async (event: Event) => {
    event.stopPropagation();
    if (busy) return;
    busy = true;
    if (await upvote(target)) {
      increment();
      render();
      notify.success("感谢您的点赞");
    }
    busy = false;
  };
  buttons.forEach((button) => button.addEventListener("click", onClick));
}

/** 绑定单个点赞按钮 */
export function bindUpvoteButton(
  button: HTMLElement,
  target: UpvoteTarget,
): void {
  bindUpvoteButtons([button], target);
}
