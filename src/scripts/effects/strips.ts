/**
 * 博主卡片彩带动画（Joe3 strips.js 的无 jQuery 重写）。
 * 鼠标移入博主卡片时撒彩带，移出后停止生成并让剩余彩带落完。
 * 系统开启「减少动态效果」时不运行。
 */
const COLORS = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"];

interface Particle {
  x: number;
  y: number;
  r: number;
  d: number;
  color: string;
  tilt: number;
  tiltAngle: number;
  tiltSpeed: number;
}

export default function start(card: HTMLElement): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = card.querySelector<HTMLCanvasElement>("canvas.joe_strips");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const count = window.innerWidth >= 988 ? 150 : 75;
  let particles: Particle[] = [];
  let angle = 0;
  let active = false;
  let frame = 0;

  const resize = () => {
    canvas.width = card.clientWidth;
    canvas.height = card.clientHeight;
  };
  const spawn = (fromTop: boolean): Particle => ({
    x: Math.random() * canvas.width,
    y: fromTop ? -10 : Math.random() * canvas.height - canvas.height,
    r: 10 + Math.random() * 20,
    d: Math.random() * count + 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] as string,
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: 0.07 * Math.random() + 0.05,
  });

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    let onScreen = 0;
    particles.forEach((p, i) => {
      p.tiltAngle += p.tiltSpeed;
      p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(angle);
      p.tilt = 15 * Math.sin(p.tiltAngle - i / 3);
      if (p.y > canvas.height || p.x < -20 || p.x > canvas.width + 20) {
        if (active) Object.assign(p, spawn(true));
      } else {
        onScreen++;
      }
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    if (active || onScreen > 0) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  card.addEventListener("mouseenter", () => {
    if (active) return;
    active = true;
    resize();
    particles = Array.from({ length: count }, () => spawn(false));
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  });
  card.addEventListener("mouseleave", () => {
    active = false;
  });
}
