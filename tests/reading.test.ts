import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readingStats } from "../src/scripts/content/reading-stats.ts";

describe("readingStats", () => {
  it("counts CJK characters and latin words", () => {
    assert.deepEqual(readingStats("使用 Astro 构建 Halo 主题"), { words: 8, minutes: 1 });
  });

  it("estimates minutes at 400 CJK chars / 200 words per minute", () => {
    assert.equal(readingStats("字".repeat(2000)).minutes, 5);
    assert.equal(readingStats("word ".repeat(600)).minutes, 3);
  });

  it("is at least one minute", () => {
    assert.equal(readingStats("").minutes, 1);
  });

  it("keeps contractions and hyphenated words as one", () => {
    assert.equal(readingStats("don't re-render").words, 2);
  });
});
