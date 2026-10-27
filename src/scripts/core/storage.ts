/** 本地存储工具（带过期时间） */

interface Expiring<T> {
  value: T;
  expiry: number;
}

export function setWithExpiry<T>(key: string, value: T, minutes: number): void {
  try {
    const item: Expiring<T> = { value, expiry: Date.now() + minutes * 60_000 };
    localStorage.setItem(key, JSON.stringify(item));
  } catch {
    // 隐私模式等场景下 localStorage 不可用，忽略
  }
}

export function getWithExpiry<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw) as Expiring<T>;
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    return null;
  }
}
