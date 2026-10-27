import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  parseItems,
  safeUrl,
} from "../src/scripts/content/shortcode-parse.ts";

describe("parseItems", () => {
  it("parses nested block items with attributes", () => {
    const items = parseItems(
      '{tabs-pane label="A"}<p>one</p>{/tabs-pane}<br>{tabs-pane label="B"}two{/tabs-pane}',
      "tabs-pane",
    );
    assert.deepEqual(items, [
      { attrs: { label: "A" }, content: "<p>one</p>" },
      { attrs: { label: "B" }, content: "two" },
    ]);
  });
  it("detects bare boolean attributes via key presence only when quoted", () => {
    const [item] = parseItems(
      '{collapse-item label="x" open=""}body{/collapse-item}',
      "collapse-item",
    );
    assert.ok(item && "open" in item.attrs);
  });
});

describe("escapeHtml", () => {
  it("escapes attribute-breaking characters", () => {
    assert.equal(
      escapeHtml(`"><script>alert('x')</script>`),
      "&quot;&gt;&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });
});

describe("safeUrl", () => {
  it("allows normal links", () => {
    assert.equal(
      safeUrl("https://halo.run/a?b=1&c=2"),
      "https://halo.run/a?b=1&amp;c=2",
    );
    assert.equal(safeUrl("/archives/x"), "/archives/x");
    assert.equal(safeUrl("#top"), "#top");
  });
  it("blocks dangerous protocols", () => {
    assert.equal(safeUrl("javascript:alert(1)"), "#");
    assert.equal(safeUrl(" JavaScript:alert(1)"), "#");
    assert.equal(safeUrl("data:text/html,<script>"), "#");
  });
});
