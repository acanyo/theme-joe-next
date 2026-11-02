import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTime,
  fromMeting,
  fromSettings,
  lyricIndex,
  metingUrl,
  nextIndex,
  parseLrc,
} from "../src/scripts/features/music-core.ts";

describe("parseLrc", () => {
  it("parses timestamps, multiple tags per line and sorts", () => {
    const lines = parseLrc("[ti:歌名]\n[00:01.50]第一句\n[00:10.00][00:30.0]副歌\n[00:05.123]第二句\n[00:20]");
    assert.deepEqual(lines, [
      { time: 1.5, text: "第一句" },
      { time: 5.123, text: "第二句" },
      { time: 10, text: "副歌" },
      { time: 20, text: "" },
      { time: 30, text: "副歌" },
    ]);
  });

  it("returns nothing for plain text", () => {
    assert.deepEqual(parseLrc("纯音乐，请欣赏"), []);
  });
});

describe("lyricIndex", () => {
  const lines = parseLrc("[00:01]a\n[00:05]b\n[00:09]c");
  it("is -1 before the first line", () => assert.equal(lyricIndex(lines, 0.5), -1));
  it("finds the current line", () => assert.equal(lyricIndex(lines, 6), 1));
  it("stays on the last line", () => assert.equal(lyricIndex(lines, 100), 2));
});

describe("formatTime", () => {
  it("formats minutes and hours", () => {
    assert.equal(formatTime(0), "0:00");
    assert.equal(formatTime(65.9), "1:05");
    assert.equal(formatTime(3725), "1:02:05");
  });
  it("handles unknown durations", () => assert.equal(formatTime(Number.NaN), "0:00"));
});

describe("track sources", () => {
  it("maps settings items and drops ones without audio", () => {
    assert.deepEqual(fromSettings([{ title: " 晴天 ", artist: "周杰伦", url: "/upload/a.mp3" }, { title: "空" }]), [
      { title: "晴天", artist: "周杰伦", url: "/upload/a.mp3", cover: "", lrc: "" },
    ]);
    assert.deepEqual(fromSettings(null), []);
  });

  it("unwraps Halo's JsonNode wrapper", () => {
    assert.deepEqual(fromSettings([{ realNode: { title: "A", url: "/a.mp3" } }]), [
      { title: "A", artist: "", url: "/a.mp3", cover: "", lrc: "" },
    ]);
  });

  it("maps Meting fields", () => {
    assert.deepEqual(fromMeting([{ name: "A", artist: "B", url: "u", pic: "p", lrc: "l" }]), [
      { title: "A", artist: "B", url: "u", cover: "p", lrc: "l" },
    ]);
  });

  it("builds the Meting playlist URL", () => {
    assert.equal(
      metingUrl("https://api.example.com/meting/", " 60198 "),
      "https://api.example.com/meting/?server=netease&type=playlist&id=60198",
    );
    assert.equal(metingUrl("https://x/api?k=1", "1"), "https://x/api?k=1&server=netease&type=playlist&id=1");
  });

  it("supports other platforms and resource types", () => {
    const url = new URL(metingUrl("https://x/api/meting", "42", {
      server: "tencent", type: "song",
    }));
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      server: "tencent", type: "song", id: "42",
    });
  });

  it("merges custom parameters without duplicate IDs and preserves URL fragments", () => {
    const url = new URL(metingUrl("https://x/api?key=a%26b&server=netease&id=old&type=playlist#section", " 周杰伦 & 晴天 ", {
      server: "kuwo", type: "search",
      params: "?limit=30&server=kugou&id=wrong&type=url&quality=high&key=c%2Bd",
    }));
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      key: "c+d", server: "kuwo", id: "周杰伦 & 晴天", type: "search", limit: "30", quality: "high",
    });
    assert.equal(url.searchParams.getAll("id").length, 1);
    assert.equal(url.hash, "#section");
  });

  it("supports relative API paths and falls back for empty options", () => {
    assert.equal(metingUrl(" /api/meting? ", " 42 ", { server: " ", type: "" }),
      "/api/meting?server=netease&type=playlist&id=42");
    const url = new URL(metingUrl("", "1", { params: "quality=high" }));
    assert.equal(url.origin, "https://api.injahow.cn");
    assert.equal(url.searchParams.get("quality"), "high");
  });

  it("preserves arbitrary parameter values, including zero and special characters", () => {
    for (const value of ["0", "true", "false", "custom / + & 中文"]) {
      const params = new URLSearchParams({ custom: value }).toString();
      const url = new URL(metingUrl("https://x/api?custom=old", "1", { params }));
      assert.deepEqual(url.searchParams.getAll("custom"), [value]);
    }
  });

  it("ignores blank extra parameters and preserves existing API parameters", () => {
    for (const params of [undefined, "", "   "]) {
      assert.equal(new URL(metingUrl("https://x/api", "1", { params })).searchParams.has("custom"), false);
      assert.equal(new URL(metingUrl("https://x/api?custom=keep", "1", { params })).searchParams.get("custom"), "keep");
    }
  });
});

describe("nextIndex", () => {
  it("wraps around in list mode", () => {
    assert.equal(nextIndex(2, 3, 1, "list"), 0);
    assert.equal(nextIndex(0, 3, -1, "list"), 2);
  });
  it("never repeats the current track in random mode", () => {
    assert.equal(nextIndex(1, 3, 1, "random", () => 0.99), 2);
    assert.equal(nextIndex(1, 3, 1, "random", () => 0.5), 2);
    assert.equal(nextIndex(1, 3, 1, "random", () => 0), 0);
  });
});
