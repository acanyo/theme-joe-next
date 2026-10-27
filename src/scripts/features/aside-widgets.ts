/**
 * 侧栏增强：3D 标签云（原生 SVG 实现，替代 3dtag jQuery 插件）、人生倒计时、网易云歌单。
 */
import { $, $$, isMobile } from "../core/dom";
import { fetchMeting, loadAPlayer } from "../content/aplayer";

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
  const size = 250;
  const radius = size * 0.38;
  const cloud = document.createElement("div");
  cloud.className = "joe_cloud3d";
  cloud.style.cssText = `position:relative;width:${size}px;height:${size}px;margin:0 auto;`;

  const points = links.map((link, i) => {
    const phi = Math.acos(-1 + (2 * i + 1) / links.length);
    const theta = Math.sqrt(links.length * Math.PI) * phi;
    const el = link.cloneNode(true) as HTMLAnchorElement;
    el.style.cssText = `position:absolute;left:50%;top:50%;white-space:nowrap;font-weight:500;color:${CLOUD_COLORS[i % CLOUD_COLORS.length]};will-change:transform,opacity;`;
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

  const rotate = () => {
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
      const scale = (p.z + radius * 2) / (radius * 3);
      p.el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${scale})`;
      p.el.style.opacity = String(0.35 + 0.65 * scale);
      p.el.style.zIndex = String(Math.round(scale * 100));
    }
    requestAnimationFrame(rotate);
  };
  list.replaceWith(cloud);
  rotate();
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

/** 网易云歌单：通过 Meting API 获取歌单，APlayer 播放（进入视口后才加载） */
async function mountMusic(el: HTMLElement): Promise<void> {
  const [APlayer, audio] = await Promise.all([
    loadAPlayer(),
    fetchMeting("playlist", el.dataset.id ?? "", el.dataset.server),
  ]);
  new APlayer({
    container: el,
    listFolded: true,
    order: "random",
    lrcType: 3,
    audio,
  });
}

function initMusic(): void {
  const players = $$("[data-joe-music]");
  if (!players.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      void mountMusic(entry.target as HTMLElement).catch((error) =>
        console.warn("[joe-next] 歌单加载失败", error),
      );
    }
  });
  players.forEach((el) => observer.observe(el));
}

export function initAsideWidgets(): void {
  initClouds();
  initLifetime();
  initMusic();
}
