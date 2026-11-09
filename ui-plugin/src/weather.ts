/** 作者编辑文章时使用的接口；访客页面不请求定位或天气。 */
export interface Region {
  city: string;
  latitude: number;
  longitude: number;
}

const CONDITIONS: Record<number, string> = {
  0: "晴", 1: "晴间多云", 2: "多云", 3: "阴", 45: "雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "强毛毛雨", 56: "轻冻毛毛雨", 57: "冻毛毛雨",
  61: "小雨", 63: "中雨", 65: "大雨", 66: "轻冻雨", 67: "冻雨",
  71: "小雪", 73: "中雪", 75: "大雪", 77: "米雪",
  80: "小阵雨", 81: "阵雨", 82: "强阵雨", 85: "小阵雪", 86: "强阵雪",
  95: "雷雨", 96: "雷雨伴冰雹", 99: "强雷雨伴冰雹",
};

async function json(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);
  return response.json();
}

export function parseRegion(value: unknown): Region | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const { latitude, longitude } = data;
  if (!city || typeof latitude !== "number" || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      typeof longitude !== "number" || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;
  return { city, latitude, longitude };
}

function currentCoordinates(signal: AbortSignal): Promise<GeolocationCoordinates> {
  if (!globalThis.isSecureContext || !navigator.geolocation)
    return Promise.reject(new Error("浏览器定位需要 HTTPS 和位置权限，也可以手动填写作者地区"));
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("定位已取消", "AbortError"));
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        signal.removeEventListener("abort", abort);
        if (!signal.aborted) resolve(coords);
      },
      ({ code }) => {
        signal.removeEventListener("abort", abort);
        reject(new Error(code === 1 ? "未获得位置权限，请手动填写作者地区" : "暂时无法获取当前位置"));
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 8000 },
    );
  });
}

export function localityRegion(value: unknown, coords: Pick<GeolocationCoordinates, "latitude" | "longitude">): Region | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const city = [data.city, data.locality, data.principalSubdivision]
    .find((name) => typeof name === "string" && name.trim());
  return parseRegion({ city, latitude: coords.latitude, longitude: coords.longitude });
}

/** 仅使用浏览器获准取得的当前位置调用 BigDataCloud，不传入缓存或第三方坐标。 */
export async function locateAuthor(signal: AbortSignal): Promise<Region> {
  const coords = await currentCoordinates(signal);
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.search = new URLSearchParams({
    latitude: String(coords.latitude), longitude: String(coords.longitude), localityLanguage: "zh",
  }).toString();
  const region = localityRegion(await json(url.href, signal), coords);
  if (!region) throw new Error("未能定位到城市，请填写作者所在地区");
  return region;
}

export async function findRegion(city: string, signal: AbortSignal): Promise<Region> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: city, count: "1", language: "zh", format: "json" }).toString();
  const data = await json(url.href, signal) as { results?: Array<Record<string, unknown>> };
  const first = data?.results?.[0];
  const region = first && parseRegion({ ...first, city });
  if (!region) throw new Error("未找到这个地区，请填写城市名，例如杭州");
  return region;
}

export function weatherText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const data = value as { current?: { temperature_2m?: unknown; weather_code?: unknown } };
  const temperature = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  if (typeof temperature !== "number" || !Number.isFinite(temperature) || typeof code !== "number") return null;
  const degrees = `${Number(temperature.toFixed(1))}°C`;
  return CONDITIONS[code] ? `${CONDITIONS[code]} · ${degrees}` : degrees;
}

export async function readWeather(region: Region, signal: AbortSignal): Promise<string> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(region.latitude), longitude: String(region.longitude),
    current: "temperature_2m,weather_code", timezone: "auto", forecast_days: "1",
  }).toString();
  const result = weatherText(await json(url.href, signal));
  if (!result) throw new Error("天气接口暂未返回有效数据");
  return result;
}
