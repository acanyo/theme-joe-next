/**
 * 从 settings.yaml 生成 src/config/setting-defaults.ts：所有设置项的默认值。
 *
 * 用途：Halo 在用户首次保存主题设置之前，不会把 settings.yaml 中的默认值写入配置，
 * 模板里读到的都是 null。构建后处理（integrations/thymeleaf-tags.ts）据此把引用改写为
 * 「未保存时取默认值」，新安装的站点即可呈现设置项声明的默认效果。
 *
 * 用法：pnpm settings:defaults（tests/settings.test.ts 会校验生成结果与 settings.yaml 一致）
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

interface Field {
  $formkit?: string;
  name?: string;
  value?: unknown;
  options?: { value: unknown }[];
  children?: Field[];
}

/**
 * 把列表项补全为与 Halo 保存后相同的形状：重复器的每个子字段都存在（缺省为 null，分组补全为嵌套 map）。
 * SpEL 的 `?.` 只防 null，访问内联 map 中不存在的键会抛异常，所以默认列表必须包含模板会读到的全部键。
 */
function complete(item: Record<string, unknown>, children: Field[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of children) {
    if (!c.name) continue;
    const own = item[c.name];
    if (c.$formkit === "group")
      out[c.name] = complete((own as Record<string, unknown>) ?? {}, c.children);
    else out[c.name] = own ?? null;
  }
  return out;
}
interface Settings {
  spec: { forms: { group: string; formSchema: Field[] }[] };
}

const isBoolean = (f: Field) =>
  f.$formkit === "switch" ||
  ((f.$formkit === "radio" || f.$formkit === "toggle") &&
    !!f.options?.length &&
    f.options.every((o) => typeof o.value === "boolean"));

export function collectDefaults(yamlText: string) {
  const settings = parse(yamlText) as Settings;
  const booleans: Record<string, boolean> = {};
  const values: Record<string, string | number> = {};
  const lists: Record<string, unknown[]> = {};
  for (const group of settings.spec.forms) {
    for (const f of group.formSchema) {
      if (!f.name) continue;
      const key = `${group.group}.${f.name}`;
      if (isBoolean(f)) booleans[key] = f.value === true;
      else if (typeof f.value === "string" && f.value !== "") values[key] = f.value;
      else if (typeof f.value === "number") values[key] = f.value;
      else if (Array.isArray(f.value) && f.value.length)
        lists[key] = f.value.map((item) =>
          complete(item as Record<string, unknown>, f.children),
        );
    }
  }
  return { booleans, values, lists };
}

export function render(defaults: ReturnType<typeof collectDefaults>): string {
  const sort = <T>(o: Record<string, T>) =>
    Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  return `// 由 scripts/settings-defaults.ts 根据 settings.yaml 生成，请勿手动修改（pnpm settings:defaults）

/** 布尔设置项及其默认值（true = 默认开启） */
export const BOOLEAN_DEFAULTS: Readonly<Record<string, boolean>> = ${JSON.stringify(sort(defaults.booleans), null, 2)};

/** 非布尔设置项中有默认值的项（文本 / 数字 / 选项） */
export const VALUE_DEFAULTS: Readonly<Record<string, string | number>> = ${JSON.stringify(sort(defaults.values), null, 2)};

/** 列表类设置项（重复器）的默认内容，模板中以 SpEL 内联列表写出 */
export const LIST_DEFAULTS: Readonly<Record<string, readonly unknown[]>> = ${JSON.stringify(sort(defaults.lists), null, 2)};
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = render(collectDefaults(readFileSync("settings.yaml", "utf8")));
  writeFileSync("src/config/setting-defaults.ts", out);
  console.log("wrote src/config/setting-defaults.ts");
}
