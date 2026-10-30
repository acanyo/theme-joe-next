import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isBadgeSeen } from "../src/scripts/features/freshness-rule.ts";

describe("isBadgeSeen", () => {
  const edited = Date.UTC(2026, 9, 20);

  it("keeps badges for posts the visitor has not read", () => {
    assert.equal(isBadgeSeen("new", undefined), false);
    assert.equal(isBadgeSeen("updated", undefined, edited), false);
  });

  it("drops 新 once the post has been read", () => {
    assert.equal(isBadgeSeen("new", edited), true);
  });

  it("drops 已更新 only when read after the edit", () => {
    assert.equal(isBadgeSeen("updated", edited - 1, edited), false);
    assert.equal(isBadgeSeen("updated", edited + 1, edited), true);
  });

  it("keeps 已更新 when the edit time is unknown", () => {
    assert.equal(isBadgeSeen("updated", edited, Number.NaN), false);
  });
});
