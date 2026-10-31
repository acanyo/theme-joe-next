import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addModulePreloads, pageChunk, staticGraph } from "../integrations/module-preload.ts";

const FILES: Record<string, string> = {
  "entry.js": 'import"./app.js";',
  "app.js": 'import{a}from"./dom.js";import{b}from"./icons.js";const p=()=>import("./pages.js");',
  "dom.js": 'import{c}from"./lifecycle.js";',
  "icons.js": "export const b=1;",
  "lifecycle.js": 'import{a}from"./dom.js";',
  "pages.js": 'import"./heavy.js";',
};
const read = (f: string) => FILES[f];

describe("staticGraph", () => {
  it("follows static imports only, without duplicates or cycles", () => {
    assert.deepEqual(staticGraph("entry.js", read), ["app.js", "dom.js", "lifecycle.js", "icons.js"]);
  });
});

describe("pageChunk", () => {
  const app = "const P={index:()=>T(()=>import(`./pages.abc.js`),D([0])),post:()=>T(()=>import(`./post.def.js`),D([5]))};";
  it("finds the current page's script chunk", () => {
    assert.equal(pageChunk('<div id="swup" data-joe-script="post">', app), "post.def.js");
    assert.equal(pageChunk('<div id="swup" data-joe-script="index">', app), "pages.abc.js");
  });
  it("returns nothing for pages without a page script", () => {
    assert.equal(pageChunk('<div id="swup">', app), undefined);
  });
});

describe("addModulePreloads", () => {
  const html = '<html><head><title>x</title></head><body><script type="module" src="/t/assets/entry.js"></script></body></html>';

  it("adds modulepreload links for the entry chain in <head>", () => {
    const out = addModulePreloads(html, read);
    const links = [...out.matchAll(/rel="modulepreload" href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(links, ["/t/assets/entry.js", "/t/assets/app.js", "/t/assets/dom.js", "/t/assets/lifecycle.js", "/t/assets/icons.js"]);
    assert.ok(out.indexOf("modulepreload") < out.indexOf("</head>"));
  });

  it("makes the entry script async so plugin defer scripts don't hold it back", () => {
    assert.match(addModulePreloads(html, read), /<script type="module" async src="\/t\/assets\/entry.js"><\/script>/);
  });

  it("is idempotent", () => {
    const once = addModulePreloads(html, read);
    assert.equal(addModulePreloads(once, read), once);
  });

  it("leaves pages without an entry script alone", () => {
    assert.equal(addModulePreloads("<html><head></head><body></body></html>", read), "<html><head></head><body></body></html>");
  });
});
