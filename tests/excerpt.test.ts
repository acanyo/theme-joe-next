import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanExcerpt } from "../src/scripts/content/excerpt.ts";

describe("cleanExcerpt", () => {
  it("drops a code block and everything after it", () => {
    assert.equal(
      cleanExcerpt(
        "这是一篇测试文章。 二级标题 正文段落。 列表项一 列表项二 export function greet(name: string): string {\n  return `Hello, ${nam",
      ),
      "这是一篇测试文章。 二级标题 正文段落。 列表项一 列表项二",
    );
  });

  it("keeps ordinary prose untouched", () => {
    const text = "如果你看到了这一篇文章，那么证明你已经安装成功了，感谢使用 Halo 进行创作。";
    assert.equal(cleanExcerpt(text), text);
  });

  it("keeps the first line when the excerpt is only code", () => {
    assert.equal(cleanExcerpt("const a = 1;\nconst b = 2;"), "const a = 1;");
  });

  it("falls back to the original text when cleaning leaves nothing", () => {
    assert.equal(cleanExcerpt("  \n  "), "");
    assert.equal(cleanExcerpt("{tabs-pane}"), "{tabs-pane}");
  });
});
