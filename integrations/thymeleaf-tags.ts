import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import {
  BOOLEAN_DEFAULTS,
  LIST_DEFAULTS,
  VALUE_DEFAULTS,
} from "../src/config/setting-defaults.ts";

/**
 * 构建后处理 Astro 输出的模板：
 *
 * 1. Astro 7 的编译器不接受带命名空间的标签名（`<th:block>`、`<halo:comment>`）。
 *    源码中以自定义元素形式书写（`<th-block>`、`<halo-comment>`），这里还原为 Thymeleaf / Halo 能识别的标签。
 * 2. 用户首次保存主题设置之前，Halo 不会写入 settings.yaml 的默认值，模板读到的都是 null；
 *    null 参与 `and` / `or` / `!` 运算时 SpEL 还会抛出异常。这里按默认值改写布尔设置的引用：
 *    默认关闭 → `(x == true)`，默认开启 → `(x != false)`（未保存时视为开启，显式关闭仍生效）。
 *    非布尔设置（文本 / 数字 / 选项）若模板里没有自己写 `?:`，补上 settings.yaml 的默认值：`(x ?: 'default')`；
 *    列表设置（如侧边栏模块）补上 SpEL 内联列表：`(x ?: {{'type':'blogger'}, ...})`。
 *    默认值由 scripts/settings-defaults.ts 从 settings.yaml 生成到 src/config/setting-defaults.ts。
 * 3. Astro 会把页面级 <script> 输出在 </html> 之后，这里移回 </body> 之前以保证 HTML 合法。
 */
const TAG_PATTERN = /<(\/?)(th|halo)-([a-z]+)(?=[\s/>])/g;

export function restoreNamespacedTags(html: string): string {
  return html.replace(TAG_PATTERN, "<$1$2:$3");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BOOLEAN_REF = new RegExp(
  `(?<![\\w.])theme\\.config\\.(${Object.keys(BOOLEAN_DEFAULTS).map(escapeRegExp).join("|")})(?![\\w.(])(?!\\s*(?:==|!=))`,
  "g",
);
/** 非布尔设置的裸引用（后面没有紧跟 `?:`、属性访问或调用） */
const VALUE_REF = new RegExp(
  `(?<![\\w.])theme\\.config\\.(${Object.keys(VALUE_DEFAULTS).map(escapeRegExp).join("|")})(?![\\w.(])(?!\\s*\\?:)`,
  "g",
);
/** JS 值 → SpEL 字面量：字符串加引号，对象写成 SpEL 内联 map `{'k':v}`，数组写成内联列表 `{a, b}` */
function spelLiteral(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
  if (Array.isArray(v)) return `{${v.map(spelLiteral).join(", ")}}`;
  if (v && typeof v === "object")
    return `{${Object.entries(v)
      .map(([k, x]) => `'${k}':${spelLiteral(x)}`)
      .join(", ")}}`;
  return "null";
}
const LIST_REF = new RegExp(
  `(?<![\\w.])theme\\.config\\.(${Object.keys(LIST_DEFAULTS).map(escapeRegExp).join("|")})(?![\\w.(])(?!\\s*\\?:)`,
  "g",
);

/** 仅处理 th:* 属性值与内联表达式中的引用 */
const EXPRESSION_ATTR = /(\sth:[\w-]+=")([^"]*)(")/g;
const INLINE_EXPR = /(\[\[|\[\(|\/\*\[\[)([\s\S]*?)(\]\]|\)\]|\]\]\*\/)/g;

export function normalizeBooleanSettings(html: string): string {
  const fix = (expr: string) =>
    expr
      .replace(BOOLEAN_REF, (ref, key: string) =>
        BOOLEAN_DEFAULTS[key] ? `(${ref} != false)` : `(${ref} == true)`,
      )
      .replace(
        VALUE_REF,
        (ref, key: string) => `(${ref} ?: ${spelLiteral(VALUE_DEFAULTS[key]!)})`,
      )
      .replace(
        LIST_REF,
        (ref, key: string) => `(${ref} ?: ${spelLiteral(LIST_DEFAULTS[key]!)})`,
      );
  return html
    .replace(
      EXPRESSION_ATTR,
      (_, start: string, value: string, end: string) =>
        start + fix(value) + end,
    )
    .replace(
      INLINE_EXPR,
      (_, start: string, value: string, end: string) =>
        start + fix(value) + end,
    );
}

export function moveTrailingScripts(html: string): string {
  const end = html.lastIndexOf("</html>");
  if (end === -1) return html;
  const trailing = html.slice(end + "</html>".length);
  if (!trailing.trim()) return html;
  const head = html.slice(0, end);
  const bodyEnd = head.lastIndexOf("</body>");
  if (bodyEnd === -1) return html;
  return `${head.slice(0, bodyEnd)}${trailing.trim()}${head.slice(bodyEnd)}</html>`;
}

export function postProcess(html: string): string {
  return moveTrailingScripts(
    normalizeBooleanSettings(restoreNamespacedTags(html)),
  );
}

async function* walkHtmlFiles(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "assets") yield* walkHtmlFiles(fullPath);
    } else if (entry.name.endsWith(".html")) {
      yield fullPath;
    }
  }
}

export default function thymeleafTags(): AstroIntegration {
  return {
    name: "theme-joe-next:thymeleaf-tags",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        let count = 0;
        for await (const file of walkHtmlFiles(fileURLToPath(dir))) {
          const source = await readFile(file, "utf-8");
          const processed = postProcess(source);
          if (processed !== source) {
            await writeFile(file, processed);
            count++;
          }
        }
        logger.info(`post-processed ${count} template(s)`);
      },
    },
  };
}
