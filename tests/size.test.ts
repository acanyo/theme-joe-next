import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { inlineCssSize } from "../scripts/qa/size.ts";

describe("inline CSS size budget", () => {
  it("counts all inline style blocks in the HTML transfer", () => {
    const html = '<style>@layer reset{body{margin:0}}</style><main></main><style th:inline="text">.header{display:flex}</style>';
    assert.equal(inlineCssSize(html), gzipSync("@layer reset{body{margin:0}}\n.header{display:flex}").length);
  });

  it("does not charge markup or script content as CSS", () => {
    assert.equal(inlineCssSize('<main>content</main><script src="/app.js"></script>'), 0);
  });
});
