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
