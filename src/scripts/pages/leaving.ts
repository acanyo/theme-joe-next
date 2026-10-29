/** 留言板：随机位置与配色的便签，支持拖拽（Pointer Events，替代 Draggabilly） */
import { $, $$ } from "../core/dom";
import { initCommentEnhancements } from "../features/comment-greeting";

const COLORS = [
  "#dcc10c",
  "#299bec",
  "#ea5455",
  "#7367f0",
  "#32ccbb",
  "#f6416c",
  "#28c76f",
  "#9f44d3",
  "#f55555",
  "#736efe",
  "#e96d71",
  "#de4313",
  "#d939cd",
  "#4c83ff",
  "#f072b6",
  "#c346c2",
  "#5961f9",
  "#fd6585",
  "#465efb",
  "#ffc600",
  "#fa742b",
  "#5151e5",
  "#bb4e75",
  "#e255cd",
  "#63c549",
  "#0ecdde",
];
const SMALL = ["20px", "30px", "40px"];
const LARGE = ["300px", "400px", "500px"];

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(list: readonly T[]): T =>
  list[random(0, list.length - 1)] as T;
const radius = (flip: boolean) =>
  flip ? `${pick(LARGE)} ${pick(SMALL)}` : `${pick(SMALL)} ${pick(LARGE)}`;

let topZ = 100;

function makeDraggable(item: HTMLElement, bounds: HTMLElement): void {
  item.style.touchAction = "none";
  item.addEventListener("pointerdown", (down) => {
    if ((down.target as HTMLElement).closest("a")) return;
    item.setPointerCapture(down.pointerId);
    item.style.zIndex = String(++topZ);
    const startX = down.clientX - item.offsetLeft;
    const startY = down.clientY - item.offsetTop;
    const move = (event: PointerEvent) => {
      const maxX = bounds.clientWidth - item.offsetWidth;
      const maxY = bounds.clientHeight - item.offsetHeight;
      item.style.left = `${Math.min(Math.max(0, event.clientX - startX), maxX)}px`;
      item.style.top = `${Math.min(Math.max(0, event.clientY - startY), maxY)}px`;
    };
    const up = () => {
      item.removeEventListener("pointermove", move);
      item.removeEventListener("pointerup", up);
    };
    item.addEventListener("pointermove", move);
    item.addEventListener("pointerup", up);
  });
}

function layoutNotes(list: HTMLElement): void {
  $$<HTMLElement>(".item", list).forEach((item) => {
    item.style.display = "block";
    Object.assign(item.style, {
      zIndex: String(random(1, 99)),
      background: pick(COLORS),
      top: `${random(0, Math.max(0, list.clientHeight - item.offsetHeight))}px`,
      left: `${random(0, Math.max(0, list.clientWidth - item.offsetWidth))}px`,
      borderTopLeftRadius: radius(true),
      borderTopRightRadius: radius(false),
      borderBottomLeftRadius: radius(false),
      borderBottomRightRadius: radius(false),
    });
    makeDraggable(item, list);
  });
}

export default function init(): void {
  const list = $(".joe_leaving-list");
  if (list) layoutNotes(list);
  initCommentEnhancements();
}
