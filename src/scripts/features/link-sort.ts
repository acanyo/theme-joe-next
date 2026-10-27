/**
 * 友链排序：`sort_seq` 大于 0 的按数值降序排在前面，其余按设置的默认方式（创建时间升/降序或保持原顺序）。
 */
import { $$ } from "../core/dom";

type DefaultSort = "asc" | "desc" | "keep";

function parseDefault(value: string | undefined): DefaultSort {
  if (value?.endsWith("_desc")) return "desc";
  if (value?.endsWith("keep_origin_sort")) return "keep";
  return "asc";
}

export function compareBySeq(
  a: HTMLElement,
  b: HTMLElement,
  fallback: DefaultSort,
): number {
  const seqA = Number(a.dataset.sort) || 0;
  const seqB = Number(b.dataset.sort) || 0;
  if (seqA > 0 || seqB > 0) return seqB - seqA;
  if (fallback === "keep") return 0;
  const timeA = Date.parse(a.dataset.created ?? "") || 0;
  const timeB = Date.parse(b.dataset.created ?? "") || 0;
  return fallback === "asc" ? timeA - timeB : timeB - timeA;
}

function sortChildren(
  parent: Element,
  selector: string,
  fallback: DefaultSort,
): void {
  const items = $$<HTMLElement>(`:scope > ${selector}`, parent);
  items
    .sort((a, b) => compareBySeq(a, b, fallback))
    .forEach((item) => parent.appendChild(item));
}

export function initLinkSort(): void {
  $$<HTMLElement>("[data-joe-links]").forEach((root) => {
    sortChildren(root, ".links-group", parseDefault(root.dataset.groupSort));
    const linkSort = parseDefault(root.dataset.linkSort);
    $$(".joe_detail__friends", root).forEach((list) =>
      sortChildren(list, ".joe_detail__friends-item", linkSort),
    );
  });
}
