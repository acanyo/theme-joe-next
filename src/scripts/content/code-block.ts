/**
 * 代码块增强：Prism 高亮（按语言懒加载）、行号、标题栏、复制、折叠、长代码自动折叠。
 * Halo 已安装代码高亮插件（如 shiki、highlight.js）时，由插件全权负责渲染，主题不再处理这些代码块。
 */
import { $$ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { copyText } from "../core/clipboard";

const CODE_SELECTOR = ".joe_detail__article pre, .joe_journal_body pre";
/** 代码高亮插件的容器：其内部的 <pre> 由插件渲染 */
const PLUGIN_OWNED = "shiki-code, .hljs, [data-highlighted]";

/** 主题设置中的代码主题 -> prism-themes 中的样式文件 */
const themeStyles = import.meta.glob(
  "/node_modules/prism-themes/themes/prism-*.min.css",
  { query: "?url", import: "default" },
);

async function loadPrismTheme(theme: string): Promise<void> {
  const loader =
    themeStyles[`/node_modules/prism-themes/themes/prism-${theme}.min.css`];
  if (!loader) return;
  const href = (await loader()) as string;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function languageOf(pre: HTMLElement): string {
  const code = pre.querySelector("code");
  const cls = `${code?.className ?? ""} ${pre.className}`;
  return (
    cls.match(/(?:lang|language)-([\w+#-]+)/)?.[1]?.toLowerCase() ?? "text"
  );
}

async function highlight(pres: HTMLElement[]): Promise<void> {
  const targets = pres.filter(
    (pre) => !pre.querySelector(".token, .line, [style*='color']"),
  );
  if (!targets.length) return;
  const { default: Prism } = await import("./prism");
  for (const pre of targets) {
    const code = pre.querySelector("code");
    if (!code) continue;
    const lang = languageOf(pre);
    code.classList.add(`language-${lang}`);
    pre.classList.add(`language-${lang}`);
    await Prism.loadLanguage(lang);
    Prism.highlightElement(code);
  }
}

function addLineNumbers(pre: HTMLElement): void {
  const code = pre.querySelector("code");
  if (!code || pre.querySelector(".line-numbers-rows")) return;
  const lines = (code.textContent ?? "").replace(/\n$/, "").split("\n").length;
  const rows = document.createElement("span");
  rows.className = "line-numbers-rows";
  rows.setAttribute("aria-hidden", "true");
  rows.innerHTML = "<span></span>".repeat(lines);
  code.appendChild(rows);
  pre.classList.add("line-numbers");
}

function addToolbar(pre: HTMLElement): void {
  const config = getThemeConfig().code;
  const wrapper = document.createElement("div");
  wrapper.className = "code-toolbar";
  pre.replaceWith(wrapper);
  wrapper.appendChild(pre);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  const label = document.createElement("div");
  label.className = "toolbar-item";
  const labelText = document.createElement("span");
  labelText.textContent = languageOf(pre).toUpperCase();
  label.appendChild(labelText);
  toolbar.appendChild(label);
  wrapper.appendChild(toolbar);

  if (config.title) pre.classList.add("c_title");
  if (config.hr) pre.classList.add("c_hr");
  if (config.macdot) pre.classList.add("c_macdot");
  if (config.newline) pre.classList.add("c_newline");
  if (config.toolsOnHover) pre.classList.add("c_hover_tools");

  if (config.expander) {
    const expander = document.createElement("button");
    expander.type = "button";
    expander.className = "joe-font joe-icon-arrow-downb code-expander";
    expander.title = "折叠/展开";
    expander.setAttribute("aria-label", "折叠/展开代码");
    expander.addEventListener("click", (event) => {
      event.stopPropagation();
      toolbar.querySelector(".autofold-tip")?.remove();
      pre.classList.toggle("close");
    });
    pre.prepend(expander);
    pre.classList.add("c_expander");
  }

  if (config.copy) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.title = "复制代码";
    button.setAttribute("aria-label", "复制代码");
    button.innerHTML =
      '<i class="joe-font joe-icon-copy" aria-hidden="true"></i>';
    button.addEventListener(
      "click",
      () => void copyText(pre.querySelector("code")?.textContent ?? ""),
    );
    pre.appendChild(button);
    pre.classList.add("c_copy");
  }
}

function foldLongCode(pres: HTMLElement[], allowed: boolean): void {
  const config = getThemeConfig().code;
  if (!allowed || !config.expander || !config.foldLong) return;
  for (const pre of pres) {
    if (pre.offsetHeight <= config.longHeight) continue;
    pre.classList.add("close");
    const tip = document.createElement("em");
    tip.className = "autofold-tip";
    tip.textContent = "<已自动折叠>";
    pre.parentElement?.querySelector(".toolbar-item span")?.appendChild(tip);
  }
}

export async function initCodeBlocks(
  options: { foldLong?: boolean } = {},
): Promise<void> {
  const pres = $$<HTMLElement>(CODE_SELECTOR).filter(
    (pre) => pre.querySelector("code") && !pre.closest(PLUGIN_OWNED),
  );
  if (!pres.length) return;
  const config = getThemeConfig();
  void loadPrismTheme(config.code.theme);
  await highlight(pres);
  for (const pre of pres) {
    if (config.code.lineNumber && !config.code.newline) addLineNumbers(pre);
    addToolbar(pre);
  }
  foldLongCode(pres, options.foldLong ?? true);
}
