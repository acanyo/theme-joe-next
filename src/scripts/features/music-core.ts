/** 音乐播放器的纯函数（无 DOM 依赖，便于单元测试） */

export interface Track {
  title: string;
  artist: string;
  url: string;
  cover: string;
  /** LRC 文件地址 */
  lrc: string;
}

export interface LyricLine {
  /** 秒 */
  time: number;
  text: string;
}

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * 主题设置「自己填写」的歌单项 → Track；没有音频地址的丢弃。
 * Halo 把设置里的数组项交给模板时是 Jackson 的 JsonNode，Thymeleaf 内联输出成 {"realNode": {…}}，这里先拆开。
 */
export function fromSettings(items: unknown): Track[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw: Record<string, unknown>) => (raw && typeof raw.realNode === "object" ? (raw.realNode as Record<string, unknown>) : raw))
    .map((item: Record<string, unknown>) => ({
      title: str(item?.title) || "未命名",
      artist: str(item?.artist),
      url: str(item?.url),
      cover: str(item?.cover),
      lrc: str(item?.lrc),
    }))
    .filter((t) => t.url);
}

/** Meting 接口返回（name / artist / url / pic / lrc）→ Track */
export function fromMeting(items: unknown): Track[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: Record<string, unknown>) => ({
      title: str(item?.name) || str(item?.title) || "未命名",
      artist: str(item?.artist) || str(item?.author),
      url: str(item?.url),
      cover: str(item?.pic) || str(item?.cover),
      lrc: str(item?.lrc),
    }))
    .filter((t) => t.url);
}

export interface MetingOptions {
  server?: string;
  type?: string;
  params?: string;
}

/** 合并接口地址与额外参数，独立设置优先，避免同名参数重复或查询串落到片段后。 */
export function metingUrl(api: string, id: string, options: MetingOptions = {}): string {
  const base = api.trim() || "https://api.injahow.cn/meting/";
  const hashAt = base.indexOf("#");
  const hash = hashAt < 0 ? "" : base.slice(hashAt);
  const address = hashAt < 0 ? base : base.slice(0, hashAt);
  const queryAt = address.indexOf("?");
  const path = queryAt < 0 ? address : address.slice(0, queryAt);
  const params = new URLSearchParams(queryAt < 0 ? "" : address.slice(queryAt + 1));
  for (const [key, value] of new URLSearchParams(options.params?.trim().replace(/^[?&]+/, ""))) {
    params.set(key, value);
  }
  params.set("server", options.server?.trim() || "netease");
  params.set("type", options.type?.trim() || "playlist");
  params.set("id", id.trim());
  return `${path}?${params}${hash}`;
}

/**
 * 解析 LRC：每行可带多个时间标签 [mm:ss.xx]，按时间排序；空行（只有时间）保留为空字符串，表示间奏。
 * 元数据行（[ti:] [ar:] [offset:] 等）忽略。
 */
export function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of text.split(/\r?\n/)) {
    const tags = [...raw.matchAll(TAG)];
    if (!tags.length) continue;
    const content = raw.replace(TAG, "").trim();
    for (const [, m, s, frac = "0"] of tags) {
      const fraction = Number(frac) / 10 ** frac.length;
      lines.push({ time: Number(m) * 60 + Number(s) + fraction, text: content });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** 当前时间对应的歌词行下标；还没到第一句时为 -1 */
export function lyricIndex(lines: LyricLine[], time: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid]!.time <= time + 0.05) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/** 秒 → m:ss（超过一小时 h:mm:ss） */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export type PlayMode = "list" | "one" | "random";

/** 按播放顺序算下一首（step = 1 下一首，-1 上一首）；单曲循环时手动切歌仍按列表走 */
export function nextIndex(current: number, length: number, step: 1 | -1, mode: PlayMode, random = Math.random): number {
  if (length <= 1) return 0;
  if (mode === "random") {
    const pick = Math.floor(random() * (length - 1));
    return pick >= current ? pick + 1 : pick;
  }
  return (current + step + length) % length;
}
