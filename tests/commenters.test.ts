import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { commentText, toCommenters } from "../src/scripts/features/commenters-core.ts";

describe("commentText", () => {
  it("turns emoji images into their alt text and strips tags", () => {
    assert.equal(commentText('<p>好文<img src="/e.png" alt="[赞]">&nbsp;收藏了</p>'), "好文[赞] 收藏了");
  });

  it("decodes basic entities and collapses whitespace", () => {
    assert.equal(commentText("<blockquote><p>a &lt;b&gt;</p></blockquote>\n\n 测试 &amp; ok"), "a <b> 测试 & ok");
  });

  it("truncates long text", () => {
    assert.equal(commentText("一".repeat(130), 10), `${"一".repeat(9)}…`);
  });
});

describe("toCommenters", () => {
  const items = [
    { owner: { displayName: "张三", avatar: "/a.png", kind: "Email" }, spec: { content: "<p>新的</p>", creationTime: "2026-10-30T00:00:00Z", owner: { annotations: { website: "https://z.example" } } } },
    { owner: { displayName: "李四", avatar: "", kind: "User" }, spec: { content: "<p>嗯</p>", owner: { annotations: { website: "https://ignored.example" } } } },
    { owner: { displayName: "张三", avatar: "/a.png", kind: "Email" }, spec: { content: "<p>旧的</p>" } },
    { owner: { displayName: "王五", kind: "Email" }, spec: {} },
  ];

  it("keeps each person's latest comment, in order", () => {
    const out = toCommenters(items, 4);
    assert.deepEqual(out.map((c) => c.name), ["张三", "李四", "王五"]);
    assert.equal(out[0]!.text, "新的");
  });

  it("only keeps a website for email commenters", () => {
    const [zhang, li] = toCommenters(items, 4);
    assert.equal(zhang!.site, "https://z.example");
    assert.equal(li!.site, undefined);
  });

  it("stops at max", () => {
    assert.equal(toCommenters(items, 2).length, 2);
  });
});
