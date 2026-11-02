import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareBySeq } from "../src/scripts/features/link-sort.ts";

const item = (name: string, sort: string, created: string) => ({
  name,
  dataset: { sort, created },
});

describe("friend link sorting", () => {
  const links = [
    item("后台第一项", "1", "2026-11-02T00:00:00Z"),
    item("后台第二项", "20", "2026-11-01T00:00:00Z"),
    item("后台第三项", "0", "2026-10-31T00:00:00Z"),
  ];

  it("preserves backend order even when annotations and dates disagree", () => {
    const sorted = [...links].sort((a, b) => compareBySeq(a, b, "keep"));
    assert.deepEqual(
      sorted.map((link) => link.name),
      links.map((link) => link.name),
    );
  });

  it("still applies positive annotation priorities in custom time modes", () => {
    for (const mode of ["asc", "desc"] as const) {
      const sorted = [...links].sort((a, b) => compareBySeq(a, b, mode));
      assert.deepEqual(
        sorted.map((link) => link.dataset.sort),
        ["20", "1", "0"],
      );
    }
  });

  it("sorts unprioritized links by the selected time direction", () => {
    const unprioritized = links.map((link) => ({
      ...link,
      dataset: { ...link.dataset, sort: "0" },
    }));
    assert.deepEqual(
      [...unprioritized]
        .sort((a, b) => compareBySeq(a, b, "asc"))
        .map((link) => link.name),
      [...links].reverse().map((link) => link.name),
    );
    assert.deepEqual(
      [...unprioritized]
        .sort((a, b) => compareBySeq(a, b, "desc"))
        .map((link) => link.name),
      links.map((link) => link.name),
    );
  });
});
