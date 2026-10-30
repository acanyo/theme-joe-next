/**
 * 申请友链弹窗（components/links/LinkApply.astro）：走链接插件的 REST API，不依赖 Cookie 与 CSRF。
 *
 * - 打开弹窗时获取验证码；每个验证码只能用一次，提交失败后自动换一张。
 * - 错误按 Problem Details 的 `status + type` 映射成中文提示，字段错误时聚焦到该字段。
 */
import { $, $$ } from "../core/dom";
import { listen, onCleanup } from "../core/lifecycle";
import { copyText } from "../core/clipboard";

const API = "/apis/api.link.halo.run/v1alpha1/link-applications";

const PROBLEMS: Record<string, string> = {
  "400 https://halo.run/probs/invalid-link-application": "请检查填写的内容",
  "400 https://halo.run/probs/invalid-link-application-captcha": "验证码错误或已过期，已换一张",
  "403 https://halo.run/probs/link-application-disabled": "本站暂未开放友链申请",
  "409 https://halo.run/probs/duplicate-link-application": "这个网站已经申请过或已在友链里了",
  "409 https://halo.run/probs/link-application-capacity-reached": "待审核的申请太多了，过几天再来吧",
  "429 https://halo.run/probs/request-not-permitted": "操作太频繁，请稍后再试",
  "503 https://halo.run/probs/link-application-unavailable": "申请服务暂时不可用",
};

interface Problem {
  status?: number;
  type?: string;
  detail?: string;
  errors?: string[];
  retryAfterSeconds?: number;
}

function bindDialog(dialog: HTMLDialogElement, opener: HTMLElement): void {
  const form = $<HTMLFormElement>("form", dialog)!;
  const done = $(".joe_link_apply__done", dialog)!;
  const result = $("[data-link-apply-result]", dialog)!;
  const captchaButton = $<HTMLButtonElement>("[data-link-apply-captcha]", dialog)!;
  const captchaImage = $<HTMLImageElement>("img", captchaButton)!;
  const captchaText = $("span", captchaButton)!;
  const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
  let challengeId: string | null = null;

  const say = (message: string, kind: "error" | "info" = "error") => {
    result.textContent = message;
    result.dataset.kind = kind;
  };

  async function refreshCaptcha(): Promise<void> {
    challengeId = null;
    captchaImage.hidden = true;
    captchaText.hidden = false;
    captchaText.textContent = "获取中…";
    try {
      const response = await fetch(`${API}/captcha`, { method: "POST", credentials: "omit" });
      if (response.status === 404 || response.status === 403) {
        captchaText.textContent = "未开放";
        say("本站暂未开放友链申请");
        submit.disabled = true;
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as { challengeId: string; image: string };
      challengeId = payload.challengeId;
      captchaImage.src = payload.image;
      captchaImage.hidden = false;
      captchaText.hidden = true;
      submit.disabled = false;
    } catch {
      captchaText.textContent = "点击重试";
    }
  }

  function fields(): Record<string, unknown> {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const body: Record<string, unknown> = {
      url: text("url"),
      displayName: text("displayName"),
      feedUrls: text("feedUrls")
        .split(/\s+/)
        .filter(Boolean),
      captchaCode: text("captchaCode"),
      challengeId,
    };
    for (const name of ["logo", "description", "email", "backlink"]) {
      const value = text(name);
      if (value) body[name] = value;
    }
    return body;
  }

  async function onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const invalid = $$<HTMLInputElement>("input, textarea", form).find((el) => !el.checkValidity());
    if (invalid) {
      invalid.focus();
      say(invalid.validationMessage || "请检查填写的内容");
      return;
    }
    if (!challengeId) {
      say("验证码还没加载好，请稍等");
      return;
    }
    submit.disabled = true;
    say("正在提交…", "info");
    try {
      const response = await fetch(API, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields()),
      });
      if (response.status === 201) {
        form.hidden = true;
        done.hidden = false;
        form.reset();
        submit.disabled = false;
        return;
      }
      const problem = ((response.headers.get("content-type") ?? "").includes("json")
        ? await response.json()
        : {}) as Problem;
      const key = `${problem.status ?? response.status} ${problem.type ?? ""}`;
      let message = PROBLEMS[key] ?? problem.detail ?? "暂时无法提交，请稍后再试";
      if (problem.retryAfterSeconds) message += `（${problem.retryAfterSeconds} 秒后可重试）`;
      if (problem.errors?.length && key.includes("invalid-link-application ")) {
        message = problem.errors.join("；");
      }
      say(message);
      if (key.includes("captcha")) $<HTMLInputElement>('[name="captchaCode"]', form)?.select();
    } catch {
      say("网络出错了，请稍后再试");
    }
    // 提交失败：验证码已被用掉，清空并换一张（成功时表单已隐藏，下次打开会重新获取）
    $<HTMLInputElement>('[name="captchaCode"]', form)!.value = "";
    await refreshCaptcha();
  }

  const open = () => {
    form.hidden = false;
    done.hidden = true;
    say("", "info");
    dialog.showModal();
    void refreshCaptcha();
    $<HTMLInputElement>('[name="displayName"]', form)?.focus();
  };

  listen(opener, "click", open);
  listen(form, "submit", (event) => void onSubmit(event));
  listen(captchaButton, "click", () => void refreshCaptcha());
  $$("[data-link-apply-close]", dialog).forEach((button) =>
    listen(button, "click", () => dialog.close()),
  );
  // 点到弹窗外（::backdrop）关闭
  listen(dialog, "click", (event) => event.target === dialog && dialog.close());
  listen($<HTMLElement>("[data-link-apply-copy]", dialog)!, "click", () => {
    const rows = $$<HTMLElement>(".site dl > div", dialog).map(
      (row) => `${$("dt", row)?.textContent}：${$("dd", row)?.textContent?.trim()}`,
    );
    void copyText(rows.join("\n"), "本站信息已复制");
  });
  onCleanup(() => dialog.open && dialog.close());
}

export function initLinkApply(): void {
  const dialog = $<HTMLDialogElement>("[data-link-apply]");
  const opener = $("[data-link-apply-open]");
  if (dialog && opener) bindDialog(dialog, opener);
}
