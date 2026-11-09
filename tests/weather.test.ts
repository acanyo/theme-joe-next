import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { localityRegion, parseRegion, weatherText } from "../ui-plugin/src/weather.ts";

describe("author region", () => {
  it("accepts a city and valid coordinates, including zero", () => {
    assert.deepEqual(parseRegion({ city: " 杭州 ", latitude: 0, longitude: 0 }), {
      city: "杭州", latitude: 0, longitude: 0,
    });
  });

  it("rejects missing cities, invalid coordinates and API error payloads", () => {
    for (const value of [null, {}, { error: true }, { city: " ", latitude: 30, longitude: 120 },
      { city: "杭州", latitude: "30", longitude: 120 }, { city: "杭州", latitude: 91, longitude: 120 },
      { city: "杭州", latitude: 30, longitude: Infinity }]) assert.equal(parseRegion(value), null);
  });

  it("uses locality as a city fallback and preserves device coordinates", () => {
    assert.deepEqual(localityRegion({ city: "", locality: "西湖区", latitude: 1, longitude: 2 }, {
      latitude: 30.27, longitude: 120.15,
    }), { city: "西湖区", latitude: 30.27, longitude: 120.15 });
    assert.equal(localityRegion({ error: "unavailable" }, { latitude: 30, longitude: 120 }), null);
  });
});

describe("weather snapshot", () => {
  it("handles clear skies, zero and negative temperatures", () => {
    assert.equal(weatherText({ current: { weather_code: 0, temperature_2m: 0 } }), "晴 · 0°C");
    assert.equal(weatherText({ current: { weather_code: 71, temperature_2m: -3.2 } }), "小雪 · -3.2°C");
    assert.equal(weatherText({ current: { weather_code: 1, temperature_2m: 23 } }), "晴间多云 · 23°C");
  });

  it("keeps the temperature when a new weather code is introduced", () => {
    assert.equal(weatherText({ current: { weather_code: 999, temperature_2m: 18.5 } }), "18.5°C");
  });

  it("does not turn missing or malformed data into a snapshot", () => {
    for (const value of [null, {}, { error: true }, { current: { weather_code: 0 } },
      { current: { weather_code: 0, temperature_2m: null } },
      { current: { weather_code: 0, temperature_2m: NaN } }]) assert.equal(weatherText(value), null);
  });
});
