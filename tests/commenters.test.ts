import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { commentAvatar, commentText, commenterWebsite, toCommenters, type PublicComment } from "../src/scripts/features/commenters-core.ts";

describe("commenterWebsite", () => {
  it("supports normal sites and rejects executable or malformed links", () => {
    assert.equal(commenterWebsite(" example.com/about "), "https://example.com/about");
    assert.equal(commenterWebsite("//example.com"), "https://example.com/");
    assert.equal(commenterWebsite("http://example.com"), "http://example.com/");
    for (const value of [undefined, "", "javascript:alert(1)", "data:text/html,test", "mailto:a@example.com", "https://", "not a site"])
      assert.equal(commenterWebsite(value), undefined);
  });
});

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
    { owner: { displayName: "张三", avatar: "/a.png", kind: "Email" }, spec: { approved: true, hidden: false, content: "<p>新的</p>", creationTime: "2026-10-30T00:00:00Z", owner: { annotations: { website: "https://z.example" } } } },
    { owner: { displayName: "李四", avatar: "", kind: "User" }, spec: { approved: true, hidden: false, content: "<p>嗯</p>", owner: { annotations: { website: "https://ignored.example" } } } },
    { owner: { displayName: "张三", avatar: "/a.png", kind: "Email" }, spec: { approved: true, hidden: false, content: "<p>旧的</p>" } },
    { owner: { displayName: "王五", kind: "Email" }, spec: { approved: true, hidden: false } },
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

  it("excludes pending, hidden, deleted and unverified comments before deduplication", () => {
    const publicComment = items[0]!;
    const privateComments: PublicComment[] = [
      { ...publicComment, spec: { ...publicComment.spec, approved: false, content: "未审核" } },
      { ...publicComment, spec: { ...publicComment.spec, hidden: true, content: "已隐藏" } },
      { ...publicComment, metadata: { deletionTimestamp: "2026-11-02T00:00:00Z" } },
      { ...publicComment, spec: { content: "缺少审核状态", hidden: false } },
      { ...publicComment, spec: { approved: true, content: "缺少公开状态" } },
      { ...publicComment, spec: undefined },
    ];
    assert.deepEqual(toCommenters(privateComments, 4), []);
    assert.deepEqual(toCommenters([...privateComments, publicComment], 4).map(c => c.text), ["新的"]);
  });

  it("keeps namesakes separate and deduplicates one identity even if its name changes", () => {
    const comment = (name: string, hash: string): PublicComment => ({
      owner: { displayName: name, kind: "Email" },
      spec: { approved: true, hidden: false, owner: { annotations: { "email-hash": hash } } },
    });
    const first = comment("同名", "a".repeat(64));
    const second = comment("同名", "b".repeat(64));
    const previous = comment("旧昵称", "a".repeat(64));
    const result = toCommenters([first, second, previous], 4);
    assert.equal(result.length, 2);
    assert.notEqual(result[0]!.avatar, result[1]!.avatar);
  });
});

describe("commentAvatar", () => {
  it("prefers the actual avatar returned by Halo", () => {
    assert.equal(commentAvatar({ owner: { avatar: " /upload/member.png ", kind: "User" } }), "/upload/member.png");
    assert.equal(commentAvatar({ owner: { avatar: "/visitor.png", kind: "Email" }, spec: { owner: { annotations: { "email-hash": "a".repeat(64) } } } }), "/visitor.png");
  });

  it("resolves email visitors using their public SHA-256 or legacy MD5 hash", () => {
    for (const length of [32, 64]) {
      const hash = "A".repeat(length);
      const url = new URL(commentAvatar({ owner: { kind: "Email" }, spec: { owner: { annotations: { "email-hash": hash } } } }));
      assert.equal(url.origin, "https://weavatar.com");
      assert.equal(url.pathname, `/avatar/${hash.toLowerCase()}`);
      assert.equal(url.searchParams.get("d"), "404");
    }
  });

  it("does not send missing or invalid identities to the avatar provider", () => {
    for (const hash of ["", "plain@example.com", "invalid", "../avatar", "a".repeat(40)]) {
      assert.equal(commentAvatar({ owner: { kind: "Email" }, spec: { owner: { annotations: { "email-hash": hash } } } }), "");
    }
    assert.equal(commentAvatar({ owner: { kind: "User" }, spec: { owner: { annotations: { "email-hash": "a".repeat(64) } } } }), "");
  });
});
