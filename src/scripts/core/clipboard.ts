/** 剪贴板写入，替代 ClipboardJS */
import { notify } from "./toast";

export async function copyText(
  text: string,
  successMessage = "复制成功！",
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 非安全上下文（http）下 Clipboard API 不可用，回退到 execCommand
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) {
      notify.error("复制失败，请手动复制");
      return false;
    }
  }
  notify.success(successMessage);
  return true;
}
