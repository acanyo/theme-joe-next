/**
 * 默认完整保留友链插件的后台顺序；选择创建时间排序时，正数 `sort_seq` 优先且越大越靠前。
 */
import { $$ } from "../core/dom.ts";

type DefaultSort = "asc" | "desc" | "keep";

function parseDefault(value: string | undefined): DefaultSort {
  if (value === "created_asc") return "asc";
  if (value === "created_desc") return "desc";
  return "keep";
}

export function compareBySeq(
  a: Pick<HTMLElement, "dataset">,
  b: Pick<HTMLElement, "dataset">,
  fallback: DefaultSort,
): number {
  if (fallback === "keep") return 0;
  const seqA = Number(a.dataset.sort) || 0;
  const seqB = Number(b.dataset.sort) || 0;
  if (seqA > 0 || seqB > 0) return seqB - seqA;
  const timeA = Date.parse(a.dataset.created ?? "") || 0;
  const timeB = Date.parse(b.dataset.created ?? "") || 0;
  return fallback === "asc" ? timeA - timeB : timeB - timeA;
}

function sortChildren(
  parent: Element,
  selector: string,
  fallback: DefaultSort,
): void {
  if (fallback === "keep") return;
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
