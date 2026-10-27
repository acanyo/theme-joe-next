/** 友链页：排序 + 评论 */
import { onIdle, onReady } from "../core/dom";
import { initLinkSort } from "../features/link-sort";
import { initWaline } from "../content/waline";

onReady(initLinkSort);
onIdle(() => void initWaline());
