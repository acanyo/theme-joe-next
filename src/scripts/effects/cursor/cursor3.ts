// 点击浮现「社会主义核心价值观」文字（原 Joe3 cursor3，去除 jQuery 依赖）。
const WORDS = ["富强", "民主", "文明", "和谐", "自由", "平等", "公正", "法治", "爱国", "敬业", "诚信", "友善"];

export default function start(): void {
  let index = 0;
  document.addEventListener("click", (event) => {
    const span = document.createElement("span");
    span.textContent = WORDS[index] ?? "";
    index = (index + 1) % WORDS.length;
    Object.assign(span.style, {
      position: "absolute",
      zIndex: "1000",
      left: `${event.pageX}px`,
      top: `${event.pageY - 20}px`,
      color: "var(--theme)",
      userSelect: "none",
      pointerEvents: "none",
      transition: "transform 1.5s ease-out, opacity 1.5s ease-out",
    });
    document.body.appendChild(span);
    requestAnimationFrame(() => {
      span.style.transform = "translateY(-160px)";
      span.style.opacity = "0";
    });
    span.addEventListener("transitionend", () => span.remove(), { once: true });
  });
}
