import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatExif } from "../src/scripts/content/exif.ts";

describe("formatExif", () => {
  it("formats camera, lens and exposure", () => {
    assert.equal(
      formatExif({ Make: "SONY", Model: "ILCE-7M4", LensModel: "FE 35mm F1.8", FocalLength: 35, FNumber: 1.8, ExposureTime: 1 / 250, ISO: 100 }),
      "SONY ILCE-7M4 · FE 35mm F1.8 · 35mm · ƒ/1.8 · 1/250 · ISO 100",
    );
  });

  it("does not repeat the brand already in the model name", () => {
    assert.equal(formatExif({ Make: "NIKON CORPORATION", Model: "NIKON Z 6", ISO: 400 }), "NIKON Z 6 · ISO 400");
  });

  it("writes long exposures in seconds", () => {
    assert.equal(formatExif({ Model: "X100V", ExposureTime: 2 }), "X100V · 2s");
  });

  it("skips images with too little information", () => {
    assert.equal(formatExif({ Model: "iPhone 15" }), null);
    assert.equal(formatExif({}), null);
  });
});
