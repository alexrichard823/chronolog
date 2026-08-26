# TR-01 Tree Library Spike

## Goal

Choose a family-tree renderer that can represent Chronolog's existing relationship model without inventing data, then verify spouse and parent-child layout using the fictional Moretti reference family.

## Requirements checked

- React 19 / Next.js compatibility.
- Parent-child and spouse/partner relationships.
- Children must attach to the correct parent union; parentage must not imply marriage.
- Multiple unions and per-parent relationship semantics should remain possible.
- No required gender field because Chronolog does not currently require gender on a person.
- Subject-centered, limited-generation rendering must be possible.
- Custom cards and click handling must be possible for TR-02.
- Pan support is required; zoom is required by TR-02.
- License must be acceptable for an MVP web product.

## Candidates

### @memoir/tree 0.8.0 — selected for prototype

Pros:
- MIT licensed, React 19 peer range, TypeScript declarations, and zero runtime dependencies.
- Family-specific graph mode represents spouse/partner/co-parent groups separately from parent-child links.
- `groupId` attaches children to the correct union rather than assuming the parents are spouses.
- Supports multiple unions, biological/step lineage, guardianship, unknown-parent slots, focal subject, limited generations, custom cards, click handlers, and panning.
- Its data model can be produced from Chronolog's existing people + relationships tables without changing the database schema.

Risks:
- New library with low adoption, so Chronolog should isolate it behind a tree adapter/component rather than couple domain data to package types.
- The 0.8.0 documentation exposes pan/center/fit/reset viewport controls but does not document built-in zoom. TR-02 will need a small zoom wrapper or a fallback renderer if zoom integration proves awkward.

### @xyflow/react / React Flow — fallback

Pros: mature React graph canvas with excellent click, zoom, pan, and custom-node support.

Reason not selected first: it is generic. Chronolog would need to own genealogy layout, union nodes, and spouse/child placement logic. That is the hardest part of the feature and would move substantial layout risk into application code.

### family-chart / relatives-tree family libraries — rejected

Reason: their primary data formats require binary gender values for layout. Chronolog's current person model does not require gender, and the tree renderer should not force users or the application to invent it.

## Moretti prototype mapping

The spike uses all nine fictional Moretti people and explicit union groups:

- Antonio Moretti + Rosa Bellini Moretti -> Vincent Moretti, Lucia Moretti Romano.
- Vincent Moretti + Margaret Hayes Moretti -> Thomas Moretti, Anna Moretti Chen.
- Anna Moretti Chen + David Chen -> Emma Chen.

Each child has one parent-child link per known parent and both links reference the correct partnership group. No sibling rows are created; sibling placement is inferred from shared parentage.

## Decision gate

TR-01 is complete only after the deployed prototype is visually checked against the Moretti expected tree and spouse + parent-child layout is acceptable. Do not merge the public `/tree-prototype` spike route into production. After validation, TR-02 should use a production family-scoped route and a Chronolog-owned adapter that converts Supabase people/relationships into the renderer graph.
