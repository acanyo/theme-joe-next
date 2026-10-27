/// <reference types="astro/client" />

/**
 * 模板中允许使用的 Thymeleaf / Spring Security 属性与自定义标签。
 * 这些属性在构建期原样输出，由 Halo 在请求时处理。
 */
type ThymeleafAttribute =
  | "attr"
  | "alt"
  | "case"
  | "checked"
  | "class"
  | "classappend"
  | "content"
  | "datetime"
  | "each"
  | "for"
  | "fragment"
  | "href"
  | "id"
  | "if"
  | "inline"
  | "insert"
  | "lang"
  | "remove"
  | "replace"
  | "src"
  | "srcset"
  | "style"
  | "switch"
  | "target"
  | "text"
  | "title"
  | "unless"
  | "utext"
  | "with";

type ThymeleafAttributes = {
  [K in ThymeleafAttribute as `th:${K}`]?: string;
} & {
  "sec:authorize"?: string;
};

declare namespace astroHTML.JSX {
  interface HTMLAttributes extends ThymeleafAttributes {}
  interface SVGAttributes extends ThymeleafAttributes {}

  interface IntrinsicElements {
    /** 构建后还原为 <th:block> */
    "th-block": HTMLAttributes;
    /** 构建后还原为 <halo:comment> */
    "halo-comment": HTMLAttributes & {
      group?: string;
      kind?: string;
      name?: string;
    };
    /** 构建后还原为 <halo:footer> */
    "halo-footer": HTMLAttributes;
  }
}

declare module "*?url" {
  const url: string;
  export default url;
}

declare module "aplayer" {
  interface AudioItem {
    name: string;
    artist: string;
    url: string;
    cover?: string;
    lrc?: string;
  }
  interface APlayerOptions {
    container: HTMLElement;
    audio: AudioItem[];
    listFolded?: boolean;
    order?: "list" | "random";
    lrcType?: 0 | 1 | 2 | 3;
  }
  export default class APlayer {
    constructor(options: APlayerOptions);
  }
}

declare module "hls.js/light" {
  export { default } from "hls.js";
}
