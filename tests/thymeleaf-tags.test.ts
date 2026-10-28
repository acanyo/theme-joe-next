import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  moveTrailingScripts,
  normalizeBooleanSettings,
  restoreNamespacedTags,
} from "../integrations/thymeleaf-tags.ts";

describe("restoreNamespacedTags", () => {
  it("restores th:block and halo:* tags", () => {
    assert.equal(
      restoreNamespacedTags(
        '<th-block th:if="${a}"><halo-comment group="x"></halo-comment></th-block>',
      ),
      '<th:block th:if="${a}"><halo:comment group="x"></halo:comment></th:block>',
    );
  });
  it("leaves other custom elements untouched", () => {
    assert.equal(
      restoreNamespacedTags("<thing-block></thing-block>"),
      "<thing-block></thing-block>",
    );
  });
});

describe("normalizeBooleanSettings", () => {
  it("wraps boolean settings used in logical expressions", () => {
    assert.equal(
      normalizeBooleanSettings(
        '<p th:if="${theme.config.moments.like or !theme.config.advanced.clean_mode}"></p>',
      ),
      '<p th:if="${(theme.config.moments.like == true) or !(theme.config.advanced.clean_mode == true)}"></p>',
    );
  });
  it("keeps explicit comparisons and non-boolean settings", () => {
    const html =
      "<p th:if=\"${theme.config.general.color_mode == 'user' and theme.config.moments.like == true}\"></p>";
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("does not touch plain attributes or text", () => {
    const html =
      '<p data-x="theme.config.moments.like">theme.config.moments.like</p>';
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("handles inline javascript expressions", () => {
    assert.equal(
      normalizeBooleanSettings(
        "<script>x = /*[[${theme.config.advanced.debug}]]*/ false;</script>",
      ),
      "<script>x = /*[[${(theme.config.advanced.debug == true)}]]*/ false;</script>",
    );
  });
});

describe("moveTrailingScripts", () => {
  it("moves scripts after </html> into body", () => {
    assert.equal(
      moveTrailingScripts(
        '<html><body><p></p></body></html><script src="a.js"></script>',
      ),
      '<html><body><p></p><script src="a.js"></script></body></html>',
    );
  });
});
