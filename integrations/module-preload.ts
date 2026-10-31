/**
 * 模块预加载（构建后处理）：页面末尾的入口脚本只是一行 `import "./app.xxx.js"`，
 * app 又静态引入 dom / icons / lifecycle，浏览器要一层层下载完才知道下一层——
 * 慢网络下 4 个小文件串行要多花 2 秒左右。
 *
 * 这里在 <head> 里为入口的整条静态依赖链加上 <link rel="modulepreload">，浏览器解析到 head 就并行下载，
 * 正文渲染不受影响（modulepreload 不阻塞渲染）。本页的页面脚本（如文章页的 post.js）也一起预加载；
 * 其他页面的脚本、特效等动态 import() 仍按需加载。
 *
 * 入口脚本同时加上 async：module 脚本默认和 defer 脚本排在同一个队列里按文档顺序执行，
 * 插件在主题前面注入的 defer 脚本（评论组件约 150KB）没下载完，主题脚本就不能执行。
 * async 后主题脚本自己的文件下载完就执行；入口在 </body> 前，执行时 DOM 已经解析完（app.ts 的 onReady 兜底）。
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

const ENTRY = /<script type="module"(?: async)? src="([^"]+\/assets\/[^"]+\.js)"><\/script>/;
/** 打包后的静态 import：`import"./x.js"`、`from"./x.js"`（不含动态 import()） */
const STATIC_IMPORT = /(?:\bimport|\bfrom)\s*"\.\/([^"]+\.js)"/g;

/** 从入口文件开始，沿静态 import 收集整条依赖链（不含入口自己），按出现顺序 */
export function staticGraph(entry: string, read: (file: string) => string | undefined): string[] {
  const seen = new Set<string>([entry]);
  const order: string[] = [];
  const visit = (file: string) => {
    const code = read(file);
    if (!code) return;
    for (const [, dep] of code.matchAll(STATIC_IMPORT)) {
      if (seen.has(dep!)) continue;
      seen.add(dep!);
      order.push(dep!);
      visit(dep!);
    }
  };
  visit(entry);
  return order;
}

/**
 * 当前页面的页面脚本（#swup[data-joe-script]）对应的分块：入口 app 里按页面名动态 import，
 * 形如 `post:()=>T(()=>import(\`./post.xxx.js\`)`。返回分块文件名，找不到时返回 undefined。
 */
export function pageChunk(html: string, appCode: string | undefined): string | undefined {
  const name = /data-joe-script="([a-z]+)"/.exec(html)?.[1];
  if (!name || !appCode) return undefined;
  return new RegExp(`\\b${name}:\\(\\)=>[^,]{0,40}import\\(\`\\./([^\`]+\\.js)\`\\)`).exec(appCode)?.[1];
}

/** 在 </head> 前插入入口与依赖的 modulepreload；已经有的不重复 */
export function addModulePreloads(html: string, read: (file: string) => string | undefined): string {
  const match = ENTRY.exec(html);
  if (!match) return html;
  const src = match[1]!;
  const base = src.slice(0, src.lastIndexOf("/") + 1);
  const entryDeps = staticGraph(src.slice(base.length), read);
  // 页面脚本：本页一定会用到，和入口一起提前下载（它的静态依赖也一并加上）
  const app = entryDeps.find((f) => /^app\./.test(f));
  const page = pageChunk(html, app ? read(app) : undefined);
  const pageDeps = page ? [page, ...staticGraph(page, read)] : [];
  const files = [...new Set([src.slice(base.length), ...entryDeps, ...pageDeps])];
  const links = files
    .map((f) => base + f)
    .filter((href) => !html.includes(`rel="modulepreload" href="${href}"`))
    .map((href) => `<link rel="modulepreload" href="${href}">`)
    .join("");
  // 入口改成 async（见文件头注释）
  const out = match[0].includes(" async ")
    ? html
    : html.replace(match[0], match[0].replace('<script type="module"', '<script type="module" async'));
  return links ? out.replace("</head>", `${links}</head>`) : out;
}

async function* htmlFiles(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "assets") yield* htmlFiles(full);
    } else if (entry.name.endsWith(".html")) yield full;
  }
}

export default function modulePreload(): AstroIntegration {
  return {
    name: "theme-joe-next:module-preload",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const cache = new Map<string, string | undefined>();
        const read = (file: string) => {
          if (!cache.has(file)) cache.set(file, undefined);
          return cache.get(file);
        };
        // 先把 assets 里的 js 读进缓存（依赖链只在这些文件之间）
        for (const entry of await readdir(join(root, "assets"))) {
          if (entry.endsWith(".js")) cache.set(entry, await readFile(join(root, "assets", entry), "utf-8"));
        }
        let count = 0;
        for await (const file of htmlFiles(root)) {
          const source = await readFile(file, "utf-8");
          const out = addModulePreloads(source, read);
          if (out !== source) {
            await writeFile(file, out);
            count++;
          }
        }
        logger.info(`module preloads added to ${count} template(s)`);
      },
    },
  };
}
