/**
 * 代码块增强：行号、标题栏、复制、折叠、长代码自动折叠。
 * 语法高亮交给 Halo 代码高亮插件（推荐 shiki）；插件渲染的代码块由插件全权负责，主题不再处理。
 * 未安装插件时，代码块以无高亮的样式显示，以上增强依然生效。
 */
import { $$ } from "../core/dom";
import { getThemeConfig } from "../core/config";
import { copyText } from "../core/clipboard";
import { iconHtml } from "../core/icons";

const CODE_SELECTOR = ".joe_detail__article pre, .joe_journal_body pre";
/** 代码高亮插件的容器：其内部的 <pre> 由插件渲染 */
const PLUGIN_OWNED = "shiki-code, .hljs, [data-highlighted]";

function languageOf(pre: HTMLElement): string {
  const code = pre.querySelector("code");
  const cls = `${code?.className ?? ""} ${pre.className}`;
  return (
    cls.match(/(?:lang|language)-([\w+#-]+)/)?.[1]?.toLowerCase() ?? "text"
  );
}

/** 标记语言类名：代码块样式按 language-* 选择器生效 */
function markLanguage(pre: HTMLElement): void {
  const lang = languageOf(pre);
  pre.classList.add(`language-${lang}`);
  pre.querySelector("code")?.classList.add(`language-${lang}`);
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
    expander.className = "code-expander";
    expander.innerHTML = iconHtml("chevron-down");
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
    button.innerHTML = iconHtml("copy");
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

export function initCodeBlocks(options: { foldLong?: boolean } = {}): void {
  const pres = $$<HTMLElement>(CODE_SELECTOR).filter(
    (pre) => pre.querySelector("code") && !pre.closest(PLUGIN_OWNED),
  );
  if (!pres.length) return;
  const config = getThemeConfig();
  for (const pre of pres) {
    markLanguage(pre);
    if (config.code.lineNumber && !config.code.newline) addLineNumbers(pre);
    addToolbar(pre);
  }
  foldLongCode(pres, options.foldLong ?? true);
}
