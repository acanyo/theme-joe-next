/** 朋友圈页：发布时间换成相对时间 */
import { $$ } from "../core/dom";
import { timeAgo } from "../core/time";

export default function init(): void {
  $$<HTMLTimeElement>(".joe_friend__item time[datetime]").forEach((time) => {
    const date = new Date(time.dateTime);
    if (!Number.isNaN(date.getTime())) time.textContent = timeAgo(date);
  });
}
