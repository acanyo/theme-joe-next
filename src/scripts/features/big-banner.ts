/** 首屏大图：打字机标题 + 一言轮播（原 EvanBigBanner，去除 jQuery） */
import { $, onIdle } from "../core/dom";
import { every, later } from "../core/lifecycle";

const PRINT_INTERVAL = 300;
const HITOKOTO_API = "https://v1.hitokoto.cn";
const HITOKOTO_ROTATE = 8000;

function typewriter(target: HTMLElement, text: string): void {
  let index = 0;
  target.textContent = "";
  const caret = document.createElement("span");
  caret.className = "evan-big-banner__caret";
  caret.textContent = "_";
  const tick = () => {
    if (index < text.length) {
      target.textContent = text.slice(0, ++index);
      target.appendChild(caret);
      later(PRINT_INTERVAL, tick);
    } else {
      every(
        PRINT_INTERVAL,
        () =>
          (caret.style.visibility =
            caret.style.visibility === "hidden" ? "visible" : "hidden"),
      );
    }
  };
  tick();
}

async function rotateHitokoto(
  text: HTMLElement,
  from: HTMLElement,
): Promise<void> {
  const show = async () => {
    try {
      const res = (await (await fetch(HITOKOTO_API)).json()) as {
        hitokoto: string;
        from: string;
      };
      text.textContent = res.hitokoto;
      from.textContent = `「 ${res.from} 」`;
    } catch {
      // 一言接口不可用时保持空白
    }
  };
  // 首屏图片和脚本加载完、浏览器空闲时再请求一言，不和首屏资源抢连接；
  // 外部图片很慢时 load 事件会迟迟不来，最多等 1.5 秒
  await new Promise<void>((resolve) => {
    onIdle(resolve);
    setTimeout(resolve, 1500);
  });
  await show();
  // 标签页在后台时不轮换，省掉看不到的请求
  every(HITOKOTO_ROTATE, () => document.visibilityState === "visible" && void show());
}

export function initBigBanner(): void {
  const banner = $("[data-joe-big-banner]");
  if (!banner) return;
  const title = $("#EvanBigBanner_Title", banner);
  if (title) typewriter(title, banner.dataset.title || title.textContent || "");
  const text = $("#HitokotoText", banner);
  const from = $("#HitokotoForm", banner);
  if (banner.dataset.hitokoto !== "false" && text && from)
    void rotateHitokoto(text, from);
}
