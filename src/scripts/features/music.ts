/**
 * 音乐播放器（components/navbar/MusicPlayer.astro）：导航中的按钮 + 弹出面板 + 一个 <audio>。
 *
 * - 整个会话只初始化一次：面板和 <audio> 移到 <body> 下（swup 容器之外），切页时不会被替换，播放不中断。
 * - 歌单：「自己填写」读 window.__JOE_MUSIC__；「网易云歌单」请求 Meting 接口，首次打开面板时才请求。
 * - 记住访客的音量、播放顺序、播到哪一首和第几秒（localStorage）。整页刷新后不会自动出声
 *   （浏览器不允许），面板里显示上次那首，点播放从上次的位置接着放。
 * - 歌词：有 LRC 地址时首次播放这首才下载，面板里显示当前一句。
 * - 面板：桌面端在按钮下方弹出，窄屏从底部滑出；Esc、点面板外、再点按钮关闭。
 */
import { $, $$ } from "../core/dom";
import { escapeHtml } from "../core/html";
import {
  formatTime,
  fromMeting,
  fromSettings,
  lyricIndex,
  metingUrl,
  nextIndex,
  parseLrc,
  type LyricLine,
  type PlayMode,
  type Track,
} from "./music-core";

declare global {
  interface Window {
    __JOE_MUSIC__?: unknown;
  }
}

const STATE_KEY = "joe-next:music";
const MODES: PlayMode[] = ["list", "one", "random"];
const MODE_LABEL: Record<PlayMode, string> = { list: "列表循环", one: "单曲循环", random: "随机播放" };

interface SavedState {
  index: number;
  time: number;
  volume: number;
  muted: boolean;
  mode: PlayMode;
  /** 歌单的指纹：歌单换了之后不再沿用旧的下标 */
  key: string;
}

function loadState(): Partial<SavedState> {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) ?? "{}") as Partial<SavedState>;
  } catch {
    return {};
  }
}

function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式等场景下不可用，忽略
  }
}

export function initMusic(): void {
  const found = $<HTMLElement>("[data-joe-music]");
  const toggles = $$<HTMLButtonElement>("[data-joe-music-toggle]");
  if (!found || !toggles.length) return;
  const root: HTMLElement = found;
  // 面板原本在导航的右侧按钮组里：导航有 transform（入场动画）会让 position: fixed 失效，
  // 手机上按钮组整体隐藏时面板也跟着看不见。移到 <body> 下；swup 只替换 #swup，<audio> 照样不会被换掉。
  document.body.appendChild(root);

  const q = <T extends Element = HTMLElement>(sel: string) => $<T>(sel, root)!;
  const audio = q<HTMLAudioElement>("[data-music-audio]");
  const ui = {
    cover: q<HTMLImageElement>("[data-music-cover]"),
    title: q("[data-music-title]"),
    artist: q("[data-music-artist]"),
    play: q<HTMLButtonElement>("[data-music-play]"),
    seek: q<HTMLInputElement>("[data-music-seek]"),
    current: q("[data-music-current]"),
    duration: q("[data-music-duration]"),
    lyric: q("[data-music-lyric]"),
    prev: q<HTMLButtonElement>("[data-music-prev]"),
    next: q<HTMLButtonElement>("[data-music-next]"),
    mode: q<HTMLButtonElement>("[data-music-mode]"),
    volume: q<HTMLInputElement>("[data-music-volume]"),
    items: q<HTMLOListElement>("[data-music-items]"),
    empty: q("[data-music-empty]"),
  };

  const source = root.dataset.source === "meting" ? "meting" : "list";
  const saved = loadState();
  let tracks: Track[] = [];
  let loaded: Promise<void> | null = null;
  let index = 0;
  let mode: PlayMode = MODES.includes(saved.mode as PlayMode) ? (saved.mode as PlayMode) : "list";
  let lyrics: LyricLine[] = [];
  let lyricFor = "";
  let seeking = false;
  /** 刷新后待恢复的播放位置（第一次播放时跳过去） */
  let resumeAt = 0;

  /** 滑块已填充的比例（样式里用 --fill 画主题色的那一段） */
  const fill = (input: HTMLInputElement) =>
    input.style.setProperty("--fill", `${(Number(input.value) / Number(input.max || 100)) * 100}%`);

  audio.volume = Math.min(1, Math.max(0, (saved.volume ?? Number(root.dataset.volume ?? 60)) / 100));
  audio.muted = !!saved.muted;
  ui.volume.value = String(Math.round(audio.volume * 100));
  fill(ui.volume);

  /** 歌单指纹：首尾两首的地址加歌曲数，歌单改了就不沿用上次的位置 */
  const listKey = () => `${tracks.length}:${tracks[0]?.url ?? ""}:${tracks.at(-1)?.url ?? ""}`;
  const persist = () =>
    saveState({
      index,
      time: audio.currentTime || resumeAt,
      volume: Math.round(audio.volume * 100),
      muted: audio.muted,
      mode,
      key: listKey(),
    });

  // ---------- 歌单 ----------
  function loadTracks(): Promise<void> {
    loaded ??= (async () => {
      if (source === "list") {
        tracks = fromSettings(window.__JOE_MUSIC__);
      } else {
        const playlist = root.dataset.playlist ?? "";
        if (!playlist.trim()) {
          tracks = [];
        } else {
          try {
            const response = await fetch(metingUrl(root.dataset.api ?? "", playlist));
            tracks = response.ok ? fromMeting(await response.json()) : [];
            if (!response.ok) showEmpty("歌单加载失败，稍后再试");
          } catch {
            tracks = [];
            showEmpty("歌单加载失败，稍后再试");
            return;
          }
        }
      }
      if (!tracks.length) {
        if (ui.empty.hidden) showEmpty(source === "meting" ? "歌单是空的，或者歌单 ID 不对" : "还没有添加歌曲");
        return;
      }
      if (saved.key === listKey() && typeof saved.index === "number" && saved.index < tracks.length) {
        index = saved.index;
        resumeAt = saved.time ?? 0;
      }
      renderList();
      show(index);
    })();
    return loaded;
  }

  function showEmpty(message: string): void {
    ui.empty.textContent = message;
    ui.empty.hidden = false;
    ui.play.disabled = ui.prev.disabled = ui.next.disabled = true;
  }

  function renderList(): void {
    ui.items.innerHTML = tracks
      .map(
        (t, i) =>
          `<li><button type="button" data-index="${i}"><span class="n">${i + 1}</span><span class="t">${escapeHtml(t.title)}</span><span class="a">${escapeHtml(t.artist)}</span></button></li>`,
      )
      .join("");
  }

  // ---------- 当前曲目 ----------
  function show(i: number): void {
    const t = tracks[i];
    if (!t) return;
    index = i;
    ui.title.textContent = t.title;
    ui.artist.textContent = t.artist;
    ui.cover.hidden = !t.cover;
    if (t.cover) ui.cover.src = t.cover;
    else ui.cover.removeAttribute("src");
    if (audio.dataset.src !== t.url) {
      audio.dataset.src = t.url;
      audio.src = t.url;
      ui.seek.value = "0";
      fill(ui.seek);
      ui.current.textContent = "0:00";
      ui.duration.textContent = "0:00";
    }
    ui.lyric.textContent = "";
    lyrics = [];
    $$("[data-index]", ui.items).forEach((b) => b.toggleAttribute("aria-current", Number(b.dataset.index) === i));
  }

  async function loadLyric(t: Track): Promise<void> {
    if (!t.lrc || lyricFor === t.url) return;
    lyricFor = t.url;
    try {
      const response = await fetch(t.lrc);
      if (!response.ok || lyricFor !== t.url) return;
      lyrics = parseLrc(await response.text());
      renderLyric();
    } catch {
      // 歌词不是必需的，失败就不显示
    }
  }

  function renderLyric(): void {
    const line = lyrics[lyricIndex(lyrics, audio.currentTime)];
    const text = line?.text ?? "";
    if (ui.lyric.textContent !== text) ui.lyric.textContent = text;
  }

  async function play(i = index): Promise<void> {
    await loadTracks();
    if (!tracks.length) return;
    if (i !== index || !audio.src) {
      resumeAt = 0;
      show(i);
    }
    if (resumeAt) {
      const at = resumeAt;
      resumeAt = 0;
      audio.addEventListener("loadedmetadata", () => (audio.currentTime = Math.min(at, audio.duration || at)), { once: true });
    }
    try {
      await audio.play();
      void loadLyric(tracks[index]!);
    } catch {
      // play() 被拒绝：多半是地址失效（audio 的 error 事件会接着换下一首），或浏览器拦截了自动播放，什么都不用做
    }
  }

  function skip(step: 1 | -1): void {
    if (!tracks.length) return;
    void play(nextIndex(index, tracks.length, step, mode));
  }

  // ---------- 面板 ----------
  let opener: HTMLButtonElement | null = null;

  function position(button: HTMLButtonElement): void {
    const rect = button.getBoundingClientRect();
    root.style.setProperty("--music-top", `${rect.bottom + 10}px`);
    root.style.setProperty("--music-right", `${Math.max(12, window.innerWidth - rect.right - 8)}px`);
  }

  function open(button: HTMLButtonElement): void {
    opener = button;
    position(button);
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    toggles.forEach((b) => b.setAttribute("aria-expanded", "true"));
    void loadTracks();
    ui.play.focus({ preventScroll: true });
  }

  function close(restoreFocus = true): void {
    if (root.hidden) return;
    root.classList.remove("is-open");
    toggles.forEach((b) => b.setAttribute("aria-expanded", "false"));
    setTimeout(() => {
      if (!root.classList.contains("is-open")) root.hidden = true;
    }, 250);
    if (restoreFocus) opener?.focus({ preventScroll: true });
  }

  toggles.forEach((button) =>
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (root.hidden) open(button);
      else close();
    }),
  );
  document.addEventListener("click", (event) => {
    if (root.hidden) return;
    const target = event.target as Node;
    if (!$(".joe_music__sheet", root)!.contains(target)) close(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.hidden) close();
  });

  // ---------- 控件 ----------
  ui.play.addEventListener("click", () => (audio.paused ? void play() : audio.pause()));
  ui.prev.addEventListener("click", () => skip(-1));
  ui.next.addEventListener("click", () => skip(1));
  ui.items.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (button) void play(Number(button.dataset.index));
  });
  ui.mode.addEventListener("click", () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]!;
    syncMode();
    persist();
  });
  ui.volume.addEventListener("input", () => {
    fill(ui.volume);
    audio.volume = Number(ui.volume.value) / 100;
    audio.muted = audio.volume === 0;
  });
  ui.seek.addEventListener("input", () => {
    seeking = true;
    fill(ui.seek);
    if (audio.duration) ui.current.textContent = formatTime((Number(ui.seek.value) / 1000) * audio.duration);
  });
  ui.seek.addEventListener("change", () => {
    seeking = false;
    if (audio.duration) audio.currentTime = (Number(ui.seek.value) / 1000) * audio.duration;
    else if (tracks.length) void play();
  });

  function syncMode(): void {
    root.dataset.mode = mode;
    ui.mode.setAttribute("aria-label", `播放顺序：${MODE_LABEL[mode]}`);
    ui.mode.title = MODE_LABEL[mode];
  }

  function syncPlaying(): void {
    const playing = !audio.paused;
    root.classList.toggle("is-playing", playing);
    toggles.forEach((b) => b.classList.toggle("is-playing", playing));
    ui.play.setAttribute("aria-label", playing ? "暂停" : "播放");
  }

  // ---------- 播放器事件 ----------
  audio.addEventListener("play", syncPlaying);
  audio.addEventListener("pause", () => {
    syncPlaying();
    persist();
  });
  audio.addEventListener("ended", () => {
    if (mode === "one") {
      audio.currentTime = 0;
      void audio.play();
    } else skip(1);
  });
  audio.addEventListener("error", () => {
    if (!audio.dataset.src) return;
    ui.lyric.textContent = "这首放不了，换下一首";
    if (tracks.length > 1) setTimeout(() => skip(1), 1200);
  });
  audio.addEventListener("loadedmetadata", () => (ui.duration.textContent = formatTime(audio.duration)));
  audio.addEventListener("timeupdate", () => {
    if (!seeking && audio.duration) {
      ui.seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      fill(ui.seek);
      ui.current.textContent = formatTime(audio.currentTime);
    }
    if (lyrics.length) renderLyric();
  });
  audio.addEventListener("volumechange", () => {
    root.classList.toggle("is-muted", audio.muted || audio.volume === 0);
    persist();
  });
  // 离开页面前记下位置（整页刷新、关闭标签页）
  window.addEventListener("pagehide", persist);

  // 系统媒体控制（锁屏、耳机按键、通知栏）
  if ("mediaSession" in navigator) {
    audio.addEventListener("play", () => {
      const t = tracks[index];
      if (!t) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        artwork: t.cover ? [{ src: t.cover }] : [],
      });
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));
  }

  closePanel = close;
  syncMode();
  syncPlaying();
  root.classList.toggle("is-muted", audio.muted || audio.volume === 0);
  // 自己填写的歌单直接显示上次那首；网易云歌单等打开面板时再请求接口
  if (source === "list") void loadTracks();
}

let closePanel: ((restoreFocus?: boolean) => void) | null = null;

/** 无刷新切页后：收起面板，播放继续 */
export function refreshMusic(): void {
  closePanel?.(false);
}
