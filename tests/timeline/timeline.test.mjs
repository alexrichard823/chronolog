import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { searchTimelinePeople, timelineHref } from "../../src/lib/timeline-filters.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const people = [
  { id: "p1", family_id: "demo", display_name: "Elena García" },
  { id: "p2", family_id: "demo", display_name: "Samuel Reed" },
  { id: "p3", family_id: "demo", display_name: "Elena Reed" },
  { id: "p4", family_id: "demo", display_name: "Casey Lane" },
];
const event = (id, type, date) => ({ id, family_id: "demo", title: `Moment ${id}`, event_type: type,
  description: "A fictional family memory.", date_precision: date ? "exact" : "unknown", date_start: date,
  date_display: date ?? "Date unknown", date_is_uncertain: false, place_name: "Maple Village", created_at: id });

// Execute the real server page against a small in-memory query double. No credentials or live data.
function setup({ role = "editor", member = true, user = true, failTable, many = false } = {}) {
  const events = many ? Array.from({ length: 29 }, (_, i) => event(`e${String(i).padStart(2, "0")}`, "move", "2000-01-01"))
    : [event("e1", "move", "1930-01-01"), { ...event("e2", "marriage", "1940-01-01"), date_precision: "approximate", date_is_uncertain: true, date_display: "About 1940" }, event("e3", "move", null), { ...event("private", "move", "1900-01-01"), family_id: "other" }];
  const tables = {
    families: [{ id: "demo", name: "Sample" }],
    family_memberships: member ? [{ family_id: "demo", user_id: "test-user", role }] : [],
    people,
    events,
    event_people: (many ? events.map((item) => ({ event_id: item.id, person_id: "p1" })) : [
      { event_id: "e1", person_id: "p1" }, { event_id: "e2", person_id: "p1" },
      { event_id: "e2", person_id: "p2" }, { event_id: "e3", person_id: "p2" },
    ]).map((link) => ({ ...link, family_id: "demo" })),
    story_events: [{ family_id: "demo", event_id: "e1", story_id: "s1" }],
    stories: [{ family_id: "demo", id: "s1", title: "A new beginning", content: "A fictional story." }],
    media_events: [], media_items: [],
  };
  const queries = [];
  const client = { auth: { getUser: async () => ({ data: { user: user ? { id: "test-user" } : null } }) }, from(table) {
    let rows = [...tables[table]], count, single = false;
    const query = { table, filters: [] }; queries.push(query);
    const builder = {
      select() { return this; },
      eq(key, value) { query.filters.push([key, value]); rows = rows.filter((row) => row[key] === value); return this; },
      in(key, values) { rows = rows.filter((row) => values.includes(row[key])); return this; },
      order(key, options = {}) { rows.sort((a, b) => a[key] == null ? 1 : b[key] == null ? -1 : String(a[key]).localeCompare(String(b[key])) * (options.ascending === false ? -1 : 1)); return this; },
      limit(size) { rows = rows.slice(0, size); return this; },
      range(start, end) { count = rows.length; rows = rows.slice(start, end + 1); return this; },
      maybeSingle() { single = true; return this; },
      then(done, reject) { return Promise.resolve({ data: single ? rows[0] ?? null : rows, count: count ?? rows.length, error: table === failTable ? new Error("Test failure") : null }).then(done, reject); },
    };
    return builder;
  } };
  const navigation = {
    redirect: (href) => { throw new Error(`REDIRECT:${href}`); },
    notFound: () => { throw new Error("NOT_FOUND"); },
    useRouter: () => ({ push() {} }),
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} }; cache.set(filename, loadedModule);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    function localRequire(name) {
      if (name === "next/navigation") return navigation;
      if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children), useLinkStatus: () => ({ pending: false }) };
      if (name === "@/lib/supabase/server") return { createClient: async () => client };
      if (name === "@/lib/media") return { createSignedMediaMap: async () => new Map() };
      if (name.endsWith(".css")) return {};
      if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
      const path = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(filename), name);
      const resolved = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
      return load(resolved);
    }
    new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  const Page = load(resolve(root, "src/app/families/[familyId]/timeline/page.tsx")).default;
  return { queries, render: async (searchParams = {}) => renderToStaticMarkup(await Page({ params: Promise.resolve({ familyId: "demo" }), searchParams: Promise.resolve(searchParams) })) };
}

test("people search accepts partial, case-insensitive, accent-insensitive and reordered names", () => {
  assert.deepEqual(searchTimelinePeople(people, "  GARCIA ele  ").map((p) => p.id), ["p1"]);
  assert.deepEqual(searchTimelinePeople(people, "Reed").map((p) => p.id), ["p2", "p3"]);
  assert.equal(searchTimelinePeople(people, "no such person").length, 0);
  assert.equal(searchTimelinePeople(people, "  ").length, 4);
});

test("filter URLs retain person/type through pagination and reset to page one on apply", () => {
  assert.equal(timelineHref("demo", "p1", "military service", 2), "/families/demo/timeline?person=p1&type=military+service&page=2");
  assert.equal(timelineHref("demo", "p1", "move"), "/families/demo/timeline?person=p1&type=move");
  assert.equal(timelineHref("demo"), "/families/demo/timeline");
});

test("combined person and event-type filters intersect, with family-scoped queries", async () => {
  const app = setup();
  const html = await app.render({ person: "p1", type: "move" });
  assert.match(html, /Moment e1/); assert.doesNotMatch(html, /Moment e2|Moment e3|Moment private/);
  assert.match(html, /A new beginning/); assert.match(html, /Maple Village/);
  for (const query of app.queries) assert.ok(query.filters.some(([key, value]) => key === (query.table === "families" ? "id" : "family_id") && value === "demo"), `${query.table} is family scoped`);
  assert.ok(app.queries.find((q) => q.table === "family_memberships").filters.some(([key, value]) => key === "user_id" && value === "test-user"));
});

test("people with no events receive an empty result rather than all-family events", async () => {
  const html = await setup().render({ person: "p4" });
  assert.match(html, /No matching moments yet/); assert.doesNotMatch(html, /Moment e1/);
});

test("uncertainty, undated entries, and connected profile links remain visible", async () => {
  const html = await setup().render();
  assert.match(html, /About 1940/); assert.match(html, /Approximate date/);
  assert.match(html, /Undated events/); assert.match(html, /Date unknown/);
  assert.match(html, /\/families\/demo\/people\/p1/);
  assert.ok(html.indexOf("Moment e1") < html.indexOf("Moment e2") && html.indexOf("Moment e2") < html.indexOf("Moment e3"));
});

test("pagination preserves both filters and redirects out-of-range pages", async () => {
  const html = await setup({ many: true }).render({ person: "p1", type: "move", page: "2" });
  assert.match(html, /Showing 26–29 of 29 events/); assert.match(html, /person=p1&amp;type=move/);
  await assert.rejects(setup({ many: true }).render({ person: "p1", type: "move", page: "9" }), /REDIRECT:.*person=p1&type=move&page=2/);
});

test("only content editors see event creation actions", async () => {
  const viewer = await setup({ role: "viewer" }).render();
  assert.doesNotMatch(viewer, /events\/new/);
  for (const role of ["owner", "admin", "editor"]) assert.match(await setup({ role }).render(), /events\/new/);
});

test("anonymous users redirect and removed members cannot render family content", async () => {
  await assert.rejects(setup({ user: false }).render(), /REDIRECT:\/login/);
  await assert.rejects(setup({ member: false }).render(), /NOT_FOUND/);
});

test("failed filter/event queries surface errors instead of misleading empty results", async () => {
  for (const failTable of ["people", "events", "event_people"]) {
    await assert.rejects(setup({ failTable }).render({ person: "p1" }), /Unable to load/);
  }
});
