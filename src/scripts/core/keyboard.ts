/** 输入法组合输入及编辑控件内的按键应交给控件处理，包含评论组件的 Shadow DOM。 */
export function isTypingEvent(event: KeyboardEvent): boolean {
  if (event.isComposing || event.keyCode === 229) return true;
  // Shadow DOM 外的 event.target 是组件宿主，composedPath 才包含实际输入框。
  return event.composedPath().some(
    (target) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        !!target.closest('input, textarea, select, [role="textbox"]')),
  );
}
