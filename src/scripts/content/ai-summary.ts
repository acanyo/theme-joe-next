/**
 * AI 摘要卡片的打字效果（components/post/AiSummary.astro）：卡片进入视口时逐字显示，点击卡片立即显示全文。
 * 全文一直在页面里（搜索引擎、读屏软件读到的都是完整内容），这里只是先隐藏、再逐段露出。
 */
import { $ } from "../core/dom";
import { observe, onCleanup } from "../core/lifecycle";

const SPEED_MS = 28;

export function initAiSummary(): void {
  const card = $<HTMLElement>("[data-joe-ai-summary]");
  const text = card && $<HTMLElement>(".text", card);
  if (!card || !text) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const full = text.textContent ?? "";
  const chars = Array.from(full);
  if (chars.length < 2) return;

  // 先占住整段的高度，打字时下面的正文不跳动
  text.style.minHeight = `${text.offsetHeight}px`;
  text.textContent = "";
  text.setAttribute("aria-label", full);
  card.classList.add("is-typing");

  let i = 0;
  let timer = 0;
  const finish = () => {
    window.clearInterval(timer);
    text.textContent = full;
    text.removeAttribute("aria-label");
    text.style.minHeight = "";
    card.classList.remove("is-typing");
  };
  const start = () => {
    timer = window.setInterval(() => {
      i += 1;
      text.textContent = chars.slice(0, i).join("");
      if (i >= chars.length) finish();
    }, SPEED_MS);
  };

  const io = observe((entries) => {
    if (!entries[0]?.isIntersecting) return;
    io.disconnect();
    start();
  }, { threshold: 0.4 });
  io.observe(card);
  card.addEventListener("click", finish, { once: true });
  onCleanup(() => window.clearInterval(timer));
}
