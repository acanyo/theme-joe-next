/** 表情面板只接受 RGB 通道，统一换算主题颜色并在深浅色切换时更新。 */
export function initCommentColors(): void {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const sync = () => {
    const styles = getComputedStyle(document.body);
    const colors = [
      ["accent", "--theme"],
      ["color", "--text-regular"],
      ["background", "--bg-page"],
      ["input", "--bg-raised"],
    ] as const;
    for (const [name, property] of colors) {
      const color = styles.getPropertyValue(property).trim();
      if (!color || !CSS.supports("color", color)) continue;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      document.body.style.setProperty(
        `--halo-cw-emoji-picker-rgb-${name}`,
        `${r}, ${g}, ${b}`,
      );
    }
  };
  sync();
  document.addEventListener("joe:color-mode", sync);
}
