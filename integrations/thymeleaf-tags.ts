import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { BOOLEAN_SETTINGS } from "../src/config/boolean-settings.ts";

/**
 * 构建后处理 Astro 输出的模板：
 *
 * 1. Astro 7 的编译器不接受带命名空间的标签名（`<th:block>`、`<halo:comment>`）。
 *    源码中以自定义元素形式书写（`<th-block>`、`<halo-comment>`），这里还原为 Thymeleaf / Halo 能识别的标签。
 * 2. 未保存过的主题设置值为 null，参与 `and` / `or` / `!` 运算时 SpEL 会抛出异常。
 *    这里把布尔设置的引用统一改写为 `(theme.config.x.y == true)`，与 null 视为 false 的语义一致。
 * 3. Astro 会把页面级 <script> 输出在 </html> 之后，这里移回 </body> 之前以保证 HTML 合法。
 */
const TAG_PATTERN = /<(\/?)(th|halo)-([a-z]+)(?=[\s/>])/g;

export function restoreNamespacedTags(html: string): string {
  return html.replace(TAG_PATTERN, "<$1$2:$3");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BOOLEAN_REF = new RegExp(
  `(?<![\\w.])theme\\.config\\.(?:${BOOLEAN_SETTINGS.map(escapeRegExp).join("|")})(?![\\w.(])(?!\\s*(?:==|!=))`,
  "g",
);
/** 仅处理 th:* 属性值与内联表达式中的引用 */
const EXPRESSION_ATTR = /(\sth:[\w-]+=")([^"]*)(")/g;
const INLINE_EXPR = /(\[\[|\[\(|\/\*\[\[)([\s\S]*?)(\]\]|\)\]|\]\]\*\/)/g;

export function normalizeBooleanSettings(html: string): string {
  const fix = (expr: string) =>
    expr.replace(BOOLEAN_REF, (ref) => `(${ref} == true)`);
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
