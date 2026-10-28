import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { BOOLEAN_SETTINGS } from "../src/config/boolean-settings.ts";
import { SERVER_CONFIG_FIELDS } from "../src/config/theme-config.ts";

interface Field {
  $formkit: string;
  name?: string;
  options?: { value: unknown }[];
}
interface Settings {
  spec: { forms: { group: string; formSchema: Field[] }[] };
}

const settings = parse(readFileSync("settings.yaml", "utf8")) as Settings;
const keys = new Set(
  settings.spec.forms.flatMap((g) => g.formSchema.map((f) => `${g.group}.${f.name}`)),
);
const booleans = settings.spec.forms.flatMap((g) =>
  g.formSchema
    .filter(
      (f) =>
        f.$formkit === "switch" ||
        (f.$formkit === "radio" &&
          !!f.options?.length &&
          f.options.every((o) => typeof o.value === "boolean")),
    )
    .map((f) => `${g.group}.${f.name}`),
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(astro|ts)$/.test(name) ? [path] : [];
  });
}

describe("settings.yaml", () => {
  it("lists every boolean setting in BOOLEAN_SETTINGS", () => {
    assert.deepEqual([...BOOLEAN_SETTINGS].sort(), [...booleans].sort());
  });

  it("only references settings that exist", () => {
    const missing = new Set<string>();
    for (const file of sourceFiles("src")) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/theme\.config\.([a-z_]+)\.([a-z_]+)\b(?!\$)/g)) {
        if (!keys.has(`${m[1]}.${m[2]}`)) missing.add(`${file}: ${m[1]}.${m[2]}`);
      }
    }
    for (const expr of Object.values(SERVER_CONFIG_FIELDS)) {
      const m = /^theme\.config\.([a-z_]+)\.([a-z_]+)$/.exec(expr);
      if (m && !keys.has(`${m[1]}.${m[2]}`)) missing.add(`theme-config.ts: ${expr}`);
    }
    assert.deepEqual([...missing], []);
  });

  it("uses snake_case keys without enable_/show_ prefixes", () => {
    const bad = [...keys].filter(
      (k) => !/^[a-z]+\.[a-z][a-z0-9_]*$/.test(k) || /\.(enable|show)_/.test(k),
    );
    assert.deepEqual(bad, []);
  });
});
