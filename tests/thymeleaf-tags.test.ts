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
        '<p th:if="${theme.config.journals.enable_like_journal or !theme.config.other.enable_clean_mode}"></p>',
      ),
      '<p th:if="${(theme.config.journals.enable_like_journal == true) or !(theme.config.other.enable_clean_mode == true)}"></p>',
    );
  });
  it("keeps explicit comparisons and non-boolean settings", () => {
    const html =
      "<p th:if=\"${theme.config.basic.theme_mode == 'user' and theme.config.journals.enable_like_journal == true}\"></p>";
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("does not touch plain attributes or text", () => {
    const html =
      '<p data-x="theme.config.journals.enable_like_journal">theme.config.journals.enable_like_journal</p>';
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("handles inline javascript expressions", () => {
    assert.equal(
      normalizeBooleanSettings(
        "<script>x = /*[[${theme.config.other.enable_debug}]]*/ false;</script>",
      ),
      "<script>x = /*[[${(theme.config.other.enable_debug == true)}]]*/ false;</script>",
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
