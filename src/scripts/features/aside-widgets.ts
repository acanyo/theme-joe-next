/**
 * 侧栏增强：3D 标签云（原生 SVG 实现，替代 3dtag jQuery 插件）、人生倒计时。
 */
import { $, $$, isMobile } from "../core/dom";
import { loop, observe } from "../core/lifecycle";

const CLOUD_COLORS = [
  "#F8D800",
  "#0396FF",
  "#EA5455",
  "#7367F0",
  "#32CCBC",
  "#F6416C",
  "#28C76F",
  "#9F44D3",
  "#F55555",
  "#736EFE",
  "#E96D71",
  "#DE4313",
  "#D939CD",
  "#4C83FF",
  "#F072B6",
  "#C346C2",
  "#5961F9",
  "#FD6585",
  "#465EFB",
  "#FFC600",
  "#FA742B",
];

/** 球面均匀分布 + 鼠标控制旋转的 3D 标签云 */
function renderCloud3d(list: HTMLElement): void {
  const links = $$<HTMLAnchorElement>("a", list);
  if (!links.length) return;
  // 标签少时缩小球体，避免一大片空白；最多占满 250px
  const size = Math.round(Math.min(250, 150 + links.length * 8));
  const radius = size * 0.38;
  const cloud = document.createElement("div");
  cloud.className = "joe_cloud3d";
  cloud.style.cssText = `position:relative;width:${size}px;height:${size}px;margin:0 auto;`;

  const points = links.map((link, i) => {
    const phi = Math.acos(-1 + (2 * i + 1) / links.length);
    const theta = Math.sqrt(links.length * Math.PI) * phi;
    const el = link.cloneNode(true) as HTMLAnchorElement;
    el.style.cssText = `position:absolute;left:50%;top:50%;white-space:nowrap;font-weight:500;--cloud-color:${CLOUD_COLORS[i % CLOUD_COLORS.length]};color:var(--cloud-text);will-change:transform,opacity;`;
    cloud.appendChild(el);
    return {
      el,
      x: radius * Math.cos(theta) * Math.sin(phi),
      y: radius * Math.sin(theta) * Math.sin(phi),
      z: radius * Math.cos(phi),
    };
  });

  let speedX = 0.004;
  let speedY = 0.004;
  cloud.addEventListener("mousemove", (event) => {
    const rect = cloud.getBoundingClientRect();
    speedX = ((event.clientY - rect.top) / size - 0.5) * 0.02;
    speedY = ((event.clientX - rect.left) / size - 0.5) * -0.02;
  });

  loop(() => {
    const [sx, cx, sy, cy] = [
      Math.sin(speedX),
      Math.cos(speedX),
      Math.sin(speedY),
      Math.cos(speedY),
    ];
    for (const p of points) {
      const y1 = p.y * cx - p.z * sx;
      const z1 = p.y * sx + p.z * cx;
      const x2 = p.x * cy + z1 * sy;
      p.z = -p.x * sy + z1 * cy;
      p.x = x2;
      p.y = y1;
      // 纵深：背面的标签缩小、变淡，但不小于原字号的 75%（约 10.5px），保证可读
      const depth = (p.z + radius) / (radius * 2);
      const scale = 0.75 + 0.35 * depth;
      p.el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${scale})`;
      p.el.style.opacity = String(0.45 + 0.55 * depth);
      p.el.style.zIndex = String(Math.round(scale * 100));
    }
  });
  list.replaceWith(cloud);
}

function initClouds(): void {
  $$<HTMLElement>("[data-cloud-3d='true']").forEach((list) => {
    if (isMobile()) list.removeAttribute("data-cloud-3d");
    else renderCloud3d(list);
  });
}

function initLifetime(): void {
  const container = $("[data-joe-lifetime]");
  if (!container) return;
  const now = new Date();
  const dayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const hours = (now.getTime() - dayStart) / 3_600_000;
  const weekDay = now.getDay() || 7;
  const monthDays = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const month = now.getMonth() + 1;
  const rows = [
    {
      title: "今日已经过去",
      unit: "小时",
      value: Math.floor(hours),
      percent: (hours / 24) * 100,
    },
    {
      title: "这周已经过去",
      unit: "天",
      value: weekDay,
      percent: (weekDay / 7) * 100,
    },
    {
      title: "本月已经过去",
      unit: "天",
      value: now.getDate(),
      percent: (now.getDate() / monthDays) * 100,
    },
    {
      title: "今年已经过去",
      unit: "个月",
      value: month,
      percent: (month / 12) * 100,
    },
  ];
  container.innerHTML = rows
    .map(
      (row, index) => `
      <div class="item">
        <div class="title">${row.title} <span class="text">${row.value}</span> ${row.unit}</div>
        <div class="progress">
          <div class="progress-bar"><div class="progress-bar-inner progress-bar-inner-${index}" style="width:${Math.floor(row.percent)}%"></div></div>
          <div class="progress-percentage">${Math.floor(row.percent)}%</div>
        </div>
      </div>`,
    )
    .join("");
}

/** 博主卡片彩带动画：仅在开启设置（渲染了 canvas）时加载 */
function initStrips(): void {
  const cards = $$("[data-joe-blogger-card]").filter((card) =>
    card.querySelector("canvas.joe_strips"),
  );
  if (!cards.length || isMobile()) return;
  void import("../effects/strips").then(({ default: start }) =>
    cards.forEach((card) => start(card)),
  );
}

export function initAsideWidgets(): void {
  initStrips();
  initClouds();
  initLifetime();
}
