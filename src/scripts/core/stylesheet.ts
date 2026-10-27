/** 运行时按需插入样式表（用于懒加载功能的 CSS，避免被构建工具提升到首屏） */

const loaded = new Map<string, Promise<void>>();

export function loadStylesheet(href: string): Promise<void> {
  let task = loaded.get(href);
  if (!task) {
    task = new Promise<void>((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(link);
    });
    loaded.set(href, task);
  }
  return task;
}
