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
        '<p th:if="${theme.config.pages.moments_like or !theme.config.footer.clean_mode}"></p>',
      ),
      '<p th:if="${(theme.config.pages.moments_like == true) or !(theme.config.footer.clean_mode == true)}"></p>',
    );
  });
  it("keeps explicit boolean comparisons", () => {
    const html =
      '<p th:if="${theme.config.pages.moments_like == true}"></p>';
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("adds settings.yaml defaults to bare value settings", () => {
    assert.equal(
      normalizeBooleanSettings(
        "<p th:if=\"${theme.config.general.color_mode == 'user'}\"></p>",
      ),
      "<p th:if=\"${(theme.config.general.color_mode ?: 'user') == 'user'}\"></p>",
    );
  });
  it("keeps value fallbacks written in the template", () => {
    const html =
      "<p th:text=\"${theme.config.pages.tags_title ?: '全部标签'}\"></p>";
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("does not touch plain attributes or text", () => {
    const html =
      '<p data-x="theme.config.pages.moments_like">theme.config.pages.moments_like</p>';
    assert.equal(normalizeBooleanSettings(html), html);
  });
  it("treats unsaved default-on switches as on", () => {
    assert.equal(
      normalizeBooleanSettings('<p th:if="${theme.config.aside.enabled}"></p>'),
      '<p th:if="${(theme.config.aside.enabled != false)}"></p>',
    );
  });
  it("handles inline javascript expressions", () => {
    assert.equal(
      normalizeBooleanSettings(
        "<script>x = /*[[${theme.config.footer.debug}]]*/ false;</script>",
      ),
      "<script>x = /*[[${(theme.config.footer.debug == true)}]]*/ false;</script>",
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
