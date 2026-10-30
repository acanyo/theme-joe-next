/**
 * 运行时按需插入第三方样式表（用于懒加载功能的 CSS，避免被构建工具提升到首屏）。
 * 样式放入 vendor 级联层，主题在后面的层中对它的覆盖不受选择器权重影响（见 integrations/css-layers.ts）。
 */

const loaded = new Map<string, Promise<void>>();

export function loadStylesheet(href: string): Promise<void> {
  let task = loaded.get(href);
  if (!task) {
    task = new Promise<void>((resolve, reject) => {
      const style = document.createElement("style");
      // 运行时加入的样式不在服务端输出的 <head> 里，swup 切页同步 <head> 时会被当成多余的删掉；
      // 而这里已记为「已加载」，回到该页时不会再插入一次（轮播图因此全部透明）。标记后由 core/swup.ts 保留
      style.dataset.joeRuntime = "";
      style.textContent = `@import url(${JSON.stringify(href)}) layer(vendor);`;
      style.onload = () => resolve();
      style.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(style);
    });
    loaded.set(href, task);
  }
  return task;
}
