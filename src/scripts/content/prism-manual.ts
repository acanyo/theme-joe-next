// 必须在 prismjs 之前执行：关闭 Prism 加载时的自动高亮，由主题控制高亮时机。
(window as unknown as { Prism?: { manual?: boolean } }).Prism = {
  manual: true,
};
export {};
