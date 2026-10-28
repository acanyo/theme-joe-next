import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import cssLayers, { LAYER_ORDER, layerOf } from "../integrations/css-layers.ts";

const statement = `@layer ${LAYER_ORDER.join(", ")};`;

describe("css layers", () => {
  it("declares the layer order before any theme styles", () => {
    for (const file of ["src/styles/index.css", "src/components/head/DynamicStyle.astro"]) {
      assert.ok(readFileSync(file, "utf8").includes(statement), `${file} must declare ${statement}`);
    }
  });

  it("maps style directories to layers", () => {
    assert.equal(layerOf("/x/src/styles/base/normalize.css"), "reset");
    assert.equal(layerOf("/x/src/styles/base/tokens.css"), "tokens");
    assert.equal(layerOf("/x/src/styles/base/animations.css"), "base");
    assert.equal(layerOf("/x/src/styles/layout/header.css"), "layout");
    assert.equal(layerOf("/x/src/styles/pages/post.css"), "pages");
    assert.equal(layerOf("/x/src/styles/index.css"), undefined);
    assert.equal(layerOf("/x/node_modules/swiper/swiper.css"), undefined);
  });

  it("wraps rules by their source file and leaves others alone", async () => {
    const a = postcss.parse(".a{color:red}.b{color:blue}", { from: "/x/src/styles/layout/a.css" });
    const b = postcss.parse(".c{color:green}", { from: "/x/src/styles/pages/b.css" });
    const v = postcss.parse(".d{color:black}", { from: "/x/node_modules/lib/d.css" });
    const root = postcss.root();
    root.append(...a.nodes, ...b.nodes, ...v.nodes);
    const out = (await postcss([cssLayers()]).process(root, { from: undefined })).css;
    assert.equal(
      out.replace(/\s+/g, ""),
      "@layerlayout{.a{color:red}.b{color:blue}}@layerpages{.c{color:green}}.d{color:black}",
    );
  });
});
