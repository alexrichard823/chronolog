import test from "node:test";
import assert from "node:assert/strict";
import { buildFamilyTreeLayout } from "@memoir/tree";
import { buildChronologFamilyGraph } from "../../src/lib/family-tree.ts";
import { containCamera, zoomAt } from "../../src/lib/tree-camera.ts";
import { people, relationships } from "./fixtures.mjs";

test("zoom preserves the person under the pointer, including at zoom limits", () => {
  const camera = { x: -200, y: -120, scale: 1 };
  const anchor = { x: 360, y: 220 };
  for (const requested of [0.01, 0.75, 1.5, 99]) {
    const next = zoomAt(camera, requested, anchor);
    assert.ok(next.scale >= 0.5 && next.scale <= 1.75);
    assert.equal((anchor.x - camera.x) / camera.scale, (anchor.x - next.x) / next.scale);
    assert.equal((anchor.y - camera.y) / camera.scale, (anchor.y - next.y) / next.scale);
  }
});

test("panning to an extreme cannot strand all family content off canvas", () => {
  const size = { width: 390, height: 600 };
  const bounds = { x: 40, y: 50, width: 1600, height: 1200 };
  for (const scale of [0.5, 1, 1.75]) {
    for (const offset of [-100000, 100000]) {
      const camera = containCamera({ x: offset, y: offset, scale }, size, bounds);
      assert.ok(camera.x + bounds.x * scale <= size.width / 2);
      assert.ok(camera.x + (bounds.x + bounds.width) * scale >= size.width / 2);
      assert.ok(camera.y + bounds.y * scale <= size.height / 2);
      assert.ok(camera.y + (bounds.y + bounds.height) * scale >= size.height / 2);
    }
  }
});

test("relationship graph retains the correct unions, uncertain dates, and guardianship", () => {
  const graph = buildChronologFamilyGraph({ people, relationships, subjectId: "alex" });
  assert.equal(graph.people.joseph.lifeDates, "About 1928 – 2004");
  assert.equal(graph.people.sam.lifeDates, "Life dates unknown");
  assert.equal(graph.parentChildLinks.find((link) => link.parentId === "alex")?.relation, "adoptive");
  assert.ok(!graph.parentChildLinks.some((link) => link.parentId === "casey"));
  assert.equal(graph.guardianshipLinks?.[0].guardianId, "casey");
  assert.equal(graph.partnershipGroups.find((group) => group.id === "partner:robert-elena")?.status, "divorced");
  assert.equal(graph.parentChildLinks.find((link) => link.parentId === "elena" && link.childId === "alex")?.groupId, "partner:robert-elena");
  assert.equal(graph.parentChildLinks.find((link) => link.parentId === "elena" && link.childId === "jordan")?.groupId, "partner:elena-sam");
  assert.ok(!graph.parentChildLinks.some((link) => link.parentId === "sam" && link.childId === "alex"));
});

test("every focal person has a finite, nonoverlapping layout, with no duplicate cards", () => {
  for (const person of people) {
    for (const depth of [1, 2, 3]) {
      const graph = buildChronologFamilyGraph({ people, relationships, subjectId: person.id });
      const layout = buildFamilyTreeLayout({ graph, estimatedCardSize: { width: 232, height: 112 }, boundsMode: "content", layoutMode: "compact-family", lineShape: "curved", spacing: { row: 88, column: 40, padding: 48 }, limits: { ancestorGenerations: depth, descendantGenerations: depth, lateralFamilyGenerations: 1 } });
      assert.ok(layout.cards.some((card) => card.personId === person.id));
      assert.equal(new Set(layout.cards.map((card) => card.personId)).size, layout.cards.length);
      for (const card of layout.cards) {
        assert.ok(Number.isFinite(card.x) && Number.isFinite(card.y));
        for (const other of layout.cards) {
          if (card === other) continue;
          assert.ok(card.x + card.width <= other.x || other.x + other.width <= card.x || card.y + card.height <= other.y || other.y + other.height <= card.y, `${person.id}: ${card.personId} overlaps ${other.personId}`);
        }
      }
      for (const edge of layout.edges) assert.ok(!/NaN|Infinity/.test(edge.path));
    }
  }
});
