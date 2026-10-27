/**
 * Prism 按需加载：核心 + 常用语言打包在一起，其余语言按需动态导入。
 * 语言之间的依赖（如 tsx 依赖 jsx、typescript）由 DEPENDENCIES 声明。
 */
import "./prism-manual";
import Prism from "prismjs";

const languageModules = import.meta.glob(
  "/node_modules/prismjs/components/prism-*.min.js",
);

const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  html: "markup",
  xml: "markup",
  vue: "markup",
  py: "python",
  rb: "ruby",
  kt: "kotlin",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
  dockerfile: "docker",
};

const DEPENDENCIES: Record<string, string[]> = {
  typescript: ["javascript"],
  jsx: ["markup", "javascript"],
  tsx: ["jsx", "typescript"],
  cpp: ["c"],
  scss: ["css"],
  less: ["css"],
  sass: ["css"],
  php: ["markup-templating"],
  kotlin: ["clike"],
  java: ["clike"],
  csharp: ["clike"],
  go: ["clike"],
  dart: ["clike"],
};

const pending = new Map<string, Promise<void>>();

async function load(lang: string): Promise<void> {
  if (Prism.languages[lang]) return;
  for (const dep of DEPENDENCIES[lang] ?? []) await load(dep);
  const loader =
    languageModules[`/node_modules/prismjs/components/prism-${lang}.min.js`];
  if (!loader) return;
  if (!pending.has(lang))
    pending.set(
      lang,
      loader().then(() => undefined),
    );
  await pending.get(lang);
}

export default {
  async loadLanguage(name: string): Promise<void> {
    const lang = ALIASES[name] ?? name;
    if (lang === "text" || lang === "plain") return;
    await load(lang);
  },
  highlightElement(el: Element): void {
    const lang = el.className.match(/language-([\w-]+)/)?.[1] ?? "";
    const resolved = ALIASES[lang] ?? lang;
    if (resolved !== lang)
      el.classList.replace(`language-${lang}`, `language-${resolved}`);
    if (Prism.languages[resolved]) Prism.highlightElement(el);
  },
};
