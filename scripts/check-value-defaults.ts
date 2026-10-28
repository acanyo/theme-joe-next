/**
 * 找出模板中非布尔设置的 `?:` 默认值与 settings.yaml 不一致的地方。
 * （没写 `?:` 的引用由构建后处理自动补上 settings.yaml 的默认值，这里只报「写了但写错」的。）
 * 用法：node --experimental-strip-types scripts/check-value-defaults.ts；tests/settings.test.ts 也会调用。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { VALUE_DEFAULTS } from "../src/config/setting-defaults.ts";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(astro|ts)$/.test(n) ? [p] : [];
  });
}

export interface Finding {
  file: string;
  key: string;
  issue: "missing" | "mismatch";
  found?: string;
}

/** 只检查真正决定页面效果的读取：输出到页面或参与比较的表达式。 */
export function findValueDefaultIssues(root = "src"): Finding[] {
  const out: Finding[] = [];
  for (const file of files(root)) {
    if (file.endsWith("setting-defaults.ts")) continue;
    const src = readFileSync(file, "utf8");
    for (const [key, def] of Object.entries(VALUE_DEFAULTS)) {
      const re = new RegExp(`theme\\.config\\.${key.replace(".", "\\.")}(?![\\w])(\\s*\\?:\\s*([^}\\)\\]|,;]+))?`, "g");
      for (const m of src.matchAll(re)) {
        if (file.endsWith("theme-config.ts")) continue; // 浏览器配置有自己的 fallback（toStr / toNumber）
        const fallback = m[2]?.trim();
        if (!fallback) continue;
        // 取出第一个字面量（'…' 或数字），忽略外层 JS 字符串的引号
        const literal = /^'([^']*)'|^(-?\d+(?:\.\d+)?)/.exec(fallback)?.slice(1).find((x) => x !== undefined) ?? fallback;
        if (literal !== String(def) && !/^theme\.config|^\(|^#/.test(fallback))
          out.push({ file, key, issue: "mismatch", found: fallback });
      }
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const issues = findValueDefaultIssues();
  for (const i of issues) console.log(`${i.issue.padEnd(8)} ${i.key.padEnd(30)} ${i.file}${i.found ? "  (" + i.found + ")" : ""}`);
  console.log(issues.length, "issue(s)");
}
