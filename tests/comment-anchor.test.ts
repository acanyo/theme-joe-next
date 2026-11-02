import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  officialCommentHash,
  parseCommentAnchor,
} from "../src/scripts/features/comment-anchor-core.ts";

describe("comment permalink anchors", () => {
  it("reads Halo comment and reply links", () => {
    assert.deepEqual(parseCommentAnchor("#halo-comment=abc&reply=def"), {
      commentName: "abc",
      replyName: "def",
      native: false,
    });
    assert.equal(parseCommentAnchor("#halo-comment=abc")?.commentName, "abc");
  });

  it("reads Comment Next links without mistaking a comment-section link for a comment", () => {
    assert.deepEqual(parseCommentAnchor("#comment-next-comment-abc"), {
      commentName: "abc",
      native: true,
    });
    assert.deepEqual(parseCommentAnchor("#comment-next-reply-def"), {
      replyName: "def",
      native: true,
    });
    assert.equal(
      parseCommentAnchor("#comment-content-halo-run-Post-demo")?.section,
      "comment-content-halo-run-Post-demo",
    );
    assert.equal(parseCommentAnchor("#comments")?.section, "comments");
  });

  it("handles encoded anchors and preserves encoded parameter delimiters", () => {
    assert.equal(
      parseCommentAnchor("#halo-comment%3Dabc%26reply%3Ddef")?.replyName,
      "def",
    );
    assert.equal(
      parseCommentAnchor("#halo-comment=abc%26def")?.commentName,
      "abc&def",
    );
    assert.equal(
      parseCommentAnchor("#comment-next-comment-%E8%AF%84%E8%AE%BA")
        ?.commentName,
      "评论",
    );
  });

  it("ignores unrelated, empty and malformed anchors", () => {
    for (const value of [
      "",
      "#",
      "#heading-1",
      "#halo-comment=",
      "#comment-next-comment-",
      "#%E0%A4%A",
    ])
      assert.equal(parseCommentAnchor(value), null);
  });

  it("converts native comment links to Halo's canonical format", () => {
    assert.equal(
      officialCommentHash({
        commentName: "a&b",
        replyName: "reply",
        native: true,
      }),
      "#halo-comment=a%26b&reply=reply",
    );
    assert.equal(
      officialCommentHash({ replyName: "reply", native: true }),
      null,
    );
  });
});
