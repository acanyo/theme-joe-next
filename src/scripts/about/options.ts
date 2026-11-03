/** 从当前页面读取受限配置，数值和颜色分别规范化后才写入 CSS。 */
export interface AboutMotionOptions {
  mode: "lively" | "soft" | "off";
  speed: number;
  strength: number;
  entrance: boolean;
  hover: boolean;
  ambient: boolean;
  skillDrift: boolean;
  parallax: boolean;
  particles: boolean;
}
const number = (
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const value = raw?.trim() ? Number(raw) : NaN;
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
};
export function configureAboutDesign(root: HTMLElement): AboutMotionOptions {
  const data = root.dataset;
  const values: [string, string | undefined, number, number, number][] = [
    ["--about-radius", data.radius, 22, 0, 40],
    ["--about-gap", data.gap, 18, 8, 40],
    ["--about-title-size", data.titleSize, 50, 28, 72],
    ["--about-avatar-size", data.avatarSize, 164, 96, 220],
  ];
  values.forEach(([key, raw, fallback, min, max]) =>
    root.style.setProperty(key, number(raw, fallback, min, max) + "px"),
  );
  if (data.style === "author") {
    root.style.setProperty(
      "--author-height",
      number(data.heroHeight, 100, 45, 100) + "svh",
    );
    root.style.setProperty(
      "--author-photo-position",
      number(data.photoPosition, 65, 0, 100) + "%",
    );
    root.style.setProperty(
      "--author-shade",
      String(number(data.photoShade, 35, 0, 80) / 100),
    );
  }
  const heroColors: [string, string | undefined][] = [
    ["--about-hero-bg", data.heroColor],
    ["--about-hero-ink", data.heroInk],
    ["--about-profile-bg", data.profileColor],
  ];
  heroColors.forEach(([key, value]) => {
    if (value && /^#[\da-f]{3,8}$/i.test(value) && CSS.supports("color", value))
      root.style.setProperty(key, value);
  });
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    const target = document.getElementById(link.hash.slice(1));
    if (
      !target ||
      (!target.getBoundingClientRect().width &&
        !target.closest("[data-author-panel][hidden]"))
    )
      link.hidden = true;
  });
  root.querySelectorAll<HTMLElement>("[data-about-module]").forEach((card) => {
    const background = card.dataset.cardBackground?.trim();
    const foreground = card.dataset.cardForeground?.trim();
    if (
      background &&
      /^#[\da-f]{3,8}$/i.test(background) &&
      CSS.supports("color", background)
    )
      card.style.setProperty("--card-surface", background);
    if (
      foreground &&
      /^#[\da-f]{3,8}$/i.test(foreground) &&
      CSS.supports("color", foreground)
    ) {
      card.style.setProperty("--card-ink", foreground);
      card.style.setProperty("--card-muted", foreground);
    }
  });
  const mode =
    data.motionMode === "off" || data.motionMode === "soft"
      ? data.motionMode
      : "lively";
  return {
    mode,
    speed: number(data.motionSpeed, 1, 0.5, 2),
    strength: mode === "soft" ? 0.45 : 1,
    entrance: data.entrance !== "false",
    hover: data.hover !== "false",
    ambient: data.ambient !== "false",
    skillDrift: data.skillDrift !== "false",
    parallax: data.parallax !== "false",
    particles: data.particles !== "false",
  };
}
export function aboutMotionAllowed(
  root: HTMLElement,
  options: AboutMotionOptions,
): boolean {
  return (
    options.mode !== "off" &&
    root.dataset.aboutMotion !== "false" &&
    !document.documentElement.classList.contains("joe-no-motion") &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
