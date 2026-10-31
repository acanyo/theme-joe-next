import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../src/scripts/core/html.ts";

describe("escapeHtml", () => {
  it("escapes attribute-breaking characters", () => {
    assert.equal(
      escapeHtml(`"><script>alert('x')</script>`),
      "&quot;&gt;&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });
});
