/**
 * 页面脚本注册表：按 #swup 容器上的 data-joe-script 选择当前页面的初始化入口。
 *
 * 首次加载与 swup 切页都通过这里执行页面脚本，各页面代码按需动态加载（代码分割），
 * 因此从首页切到文章页时，文章页脚本会被正确加载并执行。
 */
type PageInit = () => void | Promise<void>;

const PAGES: Record<string, () => Promise<{ default: PageInit }>> = {
  index: () => import("../pages/index"),
  post: () => import("../pages/post"),
  archives: () => import("../pages/archives"),
  moments: () => import("../pages/moments"),
  photos: () => import("../pages/photos"),
  links: () => import("../pages/links"),
  friends: () => import("../pages/friends"),
  leaving: () => import("../pages/leaving"),
};

export type PageScript = keyof typeof PAGES;

/** 当前页面声明的脚本名（BaseLayout 输出到 #swup[data-joe-script]） */
export function currentPageScript(): string | undefined {
  return document.getElementById("swup")?.dataset.joeScript || undefined;
}

export async function runPageScript(): Promise<void> {
  const name = currentPageScript();
  if (!name) return;
  const loader = PAGES[name];
  if (!loader) {
    console.warn(`[joe-next] 未注册的页面脚本：${name}`);
    return;
  }
  const { default: init } = await loader();
  await init();
}
