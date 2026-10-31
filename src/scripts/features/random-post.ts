/**
 * 随便看看（设置 effects.random_post）：随机打开一篇文章。
 *
 * 用 Halo 公开的文章接口（/apis/api.content.halo.run/v1alpha1/posts）：
 * 先取一条拿到文章总数，再随机取第 N 页（每页 1 篇）。总数缓存在本页会话中，第二次点击只需一次请求。
 * 当前所在的文章不会被抽到（只有一篇文章时除外）。
 * 跳转用一个临时链接的点击：开启 swup 时由它接管为无刷新切页，未开启时就是普通跳转。
 */
import { notify } from "../core/toast";

const API = "/apis/api.content.halo.run/v1alpha1/posts";

interface PostPage {
  total: number;
  items: { status?: { permalink?: string } }[];
}

let total: number | null = null;

async function fetchPage(page: number): Promise<PostPage> {
  const response = await fetch(`${API}?size=1&page=${page}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as PostPage;
}

async function pickPermalink(): Promise<string | null> {
  if (total === null) total = (await fetchPage(1)).total;
  if (!total) return null;
  const here = location.pathname;
  // 最多试 3 次避开当前文章
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = 1 + Math.floor(Math.random() * total);
    const link = (await fetchPage(page)).items[0]?.status?.permalink;
    if (link && (link !== here || total === 1)) return link;
  }
  return null;
}

/** 随机打开一篇文章；失败或没有文章时给出提示 */
export async function openRandomPost(): Promise<void> {
  try {
    const link = await pickPermalink();
    if (!link) {
      notify.info("还没有可以看的文章");
      return;
    }
    const a = document.createElement("a");
    a.href = link;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    notify.error("暂时没法随机，请稍后再试");
  }
}
