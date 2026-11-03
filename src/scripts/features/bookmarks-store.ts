/** 收藏数据：只存当前站点的文章，所有写入都明确返回结果。 */
export const BOOKMARKS_KEY = "joe-next:bookmarks";
export const BOOKMARKS_MAX = 200;

export interface SavedPost {
  id: string;
  href: string;
  title: string;
  savedAt: number;
}

type BookmarkStorage = Pick<Storage, "getItem" | "setItem">;

export function normalizeBookmarks(
  value: unknown,
  origin: string,
): SavedPost[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const links = new Set<string>();
  const result: SavedPost[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { id, href, title, savedAt } = entry as Partial<SavedPost>;
    if (
      typeof id !== "string" ||
      !id.trim() ||
      typeof href !== "string" ||
      !href.trim() ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof savedAt !== "number" ||
      !Number.isFinite(savedAt) ||
      savedAt < 0 ||
      Number.isNaN(new Date(savedAt).getTime())
    )
      continue;
    try {
      const url = new URL(href, origin);
      if (url.origin !== origin || !["http:", "https:"].includes(url.protocol))
        continue;
      const path = url.pathname + url.search;
      if (ids.has(id) || links.has(path)) continue;
      ids.add(id);
      links.add(path);
      result.push({ id, href: path, title: title.trim(), savedAt });
    } catch {
      // 丢弃损坏或来自其他站点的记录。
    }
  }
  return result.sort((a, b) => b.savedAt - a.savedAt).slice(0, BOOKMARKS_MAX);
}

export function readBookmarks(
  origin = location.origin,
  storage?: BookmarkStorage,
): SavedPost[] {
  try {
    return normalizeBookmarks(
      JSON.parse((storage ?? localStorage).getItem(BOOKMARKS_KEY) ?? "[]"),
      origin,
    );
  } catch {
    return [];
  }
}

function writeBookmarks(list: SavedPost[], storage?: BookmarkStorage): boolean {
  try {
    (storage ?? localStorage).setItem(BOOKMARKS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; reason: "invalid" | "limit" | "storage" };

export function toggleBookmark(
  post: Omit<SavedPost, "savedAt">,
  origin = location.origin,
  storage?: BookmarkStorage,
): ToggleResult {
  const candidate = normalizeBookmarks(
    [{ ...post, savedAt: Date.now() }],
    origin,
  )[0];
  if (!candidate) return { ok: false, reason: "invalid" };
  const list = readBookmarks(origin, storage);
  const saved = list.some((item) => item.id === candidate.id);
  if (!saved && list.length >= BOOKMARKS_MAX)
    return { ok: false, reason: "limit" };
  const next = saved
    ? list.filter((item) => item.id !== candidate.id)
    : [candidate, ...list.filter((item) => item.href !== candidate.href)];
  return writeBookmarks(next, storage)
    ? { ok: true, saved: !saved }
    : { ok: false, reason: "storage" };
}

export function removeBookmark(
  id: string,
  origin = location.origin,
  storage?: BookmarkStorage,
): boolean {
  return writeBookmarks(
    readBookmarks(origin, storage).filter((item) => item.id !== id),
    storage,
  );
}
