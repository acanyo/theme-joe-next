/** APlayer 按需加载（侧栏歌单与文章音乐短代码共用） */
import { loadStylesheet } from "../core/stylesheet";
import aplayerCss from "aplayer/dist/APlayer.min.css?url";

export interface MetingSong {
  title?: string;
  name?: string;
  author?: string;
  artist?: string;
  url: string;
  pic?: string;
  cover?: string;
  lrc?: string;
}

export async function loadAPlayer() {
  const [{ default: APlayer }] = await Promise.all([
    import("aplayer"),
    loadStylesheet(aplayerCss),
  ]);
  return APlayer;
}

/** 通过 Meting API 获取网易云歌曲/歌单 */
export async function fetchMeting(
  type: "song" | "playlist",
  id: string,
  server = "netease",
) {
  const res = await fetch(
    `https://api.i-meto.com/meting/api?server=${encodeURIComponent(server)}&type=${type}&id=${encodeURIComponent(id)}`,
  );
  const songs = (await res.json()) as MetingSong[];
  return songs.map((s) => ({
    name: s.title ?? s.name ?? "",
    artist: s.author ?? s.artist ?? "",
    url: s.url,
    cover: s.pic ?? s.cover,
    lrc: s.lrc,
  }));
}
