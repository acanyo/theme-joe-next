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
      style.textContent = `@import url(${JSON.stringify(href)}) layer(vendor);`;
      style.onload = () => resolve();
      style.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(style);
    });
    loaded.set(href, task);
  }
  return task;
}
