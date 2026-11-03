import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BOOKMARKS_KEY,
  BOOKMARKS_MAX,
  normalizeBookmarks,
  readBookmarks,
  removeBookmark,
  toggleBookmark,
} from "../src/scripts/features/bookmarks-store.ts";

const ORIGIN = "https://blog.example";
const post = {
  id: "post-1",
  title: '文章 <测试> "标题"',
  href: "/archives/first",
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("article bookmarks", () => {
  it("persists, restores and cancels the same article by its stable ID", () => {
    const storage = memoryStorage();
    assert.deepEqual(toggleBookmark(post, ORIGIN, storage), {
      ok: true,
      saved: true,
    });
    assert.equal(readBookmarks(ORIGIN, storage)[0]?.title, post.title);
    assert.equal(readBookmarks(ORIGIN, storage)[0]?.href, post.href);
    assert.deepEqual(
      toggleBookmark({ ...post, href: "/renamed" }, ORIGIN, storage),
      { ok: true, saved: false },
    );
    assert.deepEqual(readBookmarks(ORIGIN, storage), []);
  });

  it("rejects foreign origins and executable URLs; saves only a site's own path", () => {
    for (const href of [
      "https://evil.example/post",
      "//evil.example/post",
      "javascript:alert(1)",
      "data:text/html,test",
      "\\\\evil.example/post",
    ]) {
      assert.deepEqual(
        normalizeBookmarks([{ ...post, href, savedAt: 1 }], ORIGIN),
        [],
      );
    }
    assert.equal(
      normalizeBookmarks(
        [{ ...post, href: `${ORIGIN}/article?view=full#comment`, savedAt: 1 }],
        ORIGIN,
      )[0]?.href,
      "/article?view=full",
    );
  });

  it("discards damaged records and deduplicates IDs and permalinks", () => {
    const records = [
      null,
      "invalid",
      {},
      { ...post, savedAt: Infinity },
      { ...post, savedAt: 1e100 },
      { ...post, savedAt: "1" },
      { ...post, savedAt: 10 },
      { ...post, href: "/duplicate-id", savedAt: 5 },
      { ...post, id: "duplicate-path", savedAt: 4 },
      { ...post, id: "post-2", href: "/second", savedAt: 20 },
    ];
    assert.deepEqual(
      normalizeBookmarks(records, ORIGIN).map((item) => item.id),
      ["post-2", "post-1"],
    );
    assert.deepEqual(normalizeBookmarks({}, ORIGIN), []);
  });

  it("reports storage failures without claiming an article was saved", () => {
    const storage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota exceeded");
      },
    };
    assert.deepEqual(readBookmarks(ORIGIN, storage), []);
    assert.deepEqual(toggleBookmark(post, ORIGIN, storage), {
      ok: false,
      reason: "storage",
    });
    assert.equal(removeBookmark(post.id, ORIGIN, storage), false);
  });

  it("recovers from invalid JSON and removes only the selected item", () => {
    const storage = memoryStorage();
    storage.setItem(BOOKMARKS_KEY, "{");
    assert.deepEqual(readBookmarks(ORIGIN, storage), []);
    toggleBookmark(post, ORIGIN, storage);
    toggleBookmark({ ...post, id: "post-2", href: "/second" }, ORIGIN, storage);
    assert.equal(removeBookmark(post.id, ORIGIN, storage), true);
    assert.deepEqual(
      readBookmarks(ORIGIN, storage).map((item) => item.id),
      ["post-2"],
    );
  });

  it("keeps existing bookmarks at capacity and still permits cancellation", () => {
    const storage = memoryStorage();
    const records = Array.from({ length: BOOKMARKS_MAX }, (_, index) => ({
      id: `post-${index}`,
      href: `/post/${index}`,
      title: `文章 ${index}`,
      savedAt: index,
    }));
    storage.setItem(BOOKMARKS_KEY, JSON.stringify(records));
    assert.deepEqual(
      toggleBookmark({ ...post, id: "new", href: "/new" }, ORIGIN, storage),
      { ok: false, reason: "limit" },
    );
    assert.equal(readBookmarks(ORIGIN, storage).length, BOOKMARKS_MAX);
    assert.deepEqual(
      toggleBookmark({ ...post, id: "post-1" }, ORIGIN, storage),
      { ok: true, saved: false },
    );
    assert.equal(readBookmarks(ORIGIN, storage).length, BOOKMARKS_MAX - 1);
  });
});
