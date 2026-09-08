# UX-09 — Family tree redesign

Status: Implemented; automated checks complete; desktop/mobile visual acceptance pending.

## User-visible changes

- Warm Chronolog page styling, a white rounded canvas, compact rounded person cards, circular portraits/initials, and evergreen selection states.
- Thin curved connectors with distinguishable adoptive/step/foster/guardian and former-partnership lines, plus a plain-language line guide.
- Search the whole loaded family, including people outside the visible branch, and center on a result. The focal person remains in the URL and browser history.
- Show one, two, or three generations each way. Two is the initial setting; recentering and searching provide access to other branches.
- Dismissible desktop person preview and a modal bottom sheet on mobile, with full names/dates, exact direct relationship details, profile/timeline links, and centering.
- Pan, pointer-anchored zoom, touch pinch gestures, keyboard pan/zoom, and recenter. Only the scene transforms; the canvas stays fixed and clips content. Pan bounds prevent losing the entire tree.
- Add relationship follows the selected person; creation actions only appear for Owner/Admin/Editor, including on the empty screen.

## Implementation and privacy

Uses `@memoir/tree` 0.8.0's existing headless family layout. The existing graph adapter and relationship records remain authoritative. No new graph dependency, schema change, migration, role change, or data mutation.

The page reads membership and `profile_photo_path` through the current member's Supabase client. Only paths inside the current family prefix are signed, using the existing private-media helper and five-minute expiry. Missing, unavailable, or expired photos fall back to initials. This implements portrait display using the existing field; it does not introduce a portrait upload/selection workflow or turn an arbitrary attached/group photograph into a portrait.

Existing full-family queries remain; neighborhood-query scaling (IMP-007) is a separate task. The implementation limits rendered generations rather than claiming to reduce the database fetch size.

The only unrelated change replaces the existing error-page HTML anchor with Next.js `Link`, resolving a pre-existing error encountered in the required lint gate.

## Automated verification

- `node --experimental-strip-types --test tests/tree/tree.test.mjs`: four focused tests covering cursor-anchored zoom at limits, bounded pan, uncertain dates, correct remarriage/half-sibling parentage, adoptive/guardian separation, and finite/nonoverlapping layouts for every fictional focal person at three depths.
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.
- Read-only development database metadata confirms the existing `people.profile_photo_path` text column. No real family contents or credentials are included in fixtures or evidence.

## Browser verification limitation

A separate, local-only Next.js harness was prepared with fictional family data. It is not part of the application or PR. The cloud browser rejected localhost with `ERR_BLOCKED_BY_CLIENT`; the local browser daemon could not start and Chrome failed on a restricted socket syscall. Consequently, no screenshots, authenticated data-flow acceptance, real browser gestures, or mobile visual checks are claimed as passed.

## Required preview acceptance

1. On desktop, open an existing tree. Check card spacing, readable names/dates, curved lines, white canvas, and green selection. Open and dismiss the person preview; verify profile/timeline destinations.
2. Drag blank canvas and drag starting on a card. Both should pan without accidentally opening a preview. A normal click must still open it. Zoom repeatedly and recenter; the viewport must not expose a transformed outer border or lose the tree.
3. Search for a person outside the visible branch and press Enter or choose the result. Confirm that person is centered, URL context changes, and browser Back restores the prior focal person.
4. Switch generation depth. Confirm nearby relatives remain correctly grouped and no cards overlap. Check a known remarriage/half-sibling/adoptive/guardian case against saved relationships.
5. On a phone, drag in both directions and pinch in/out. The page must still scroll outside the tree. Tap a person: the bottom sheet should open, keep its controls visible, and close via its close button/backdrop/Escape where supported.
6. With keyboard only, tab to the canvas, pan with arrows, zoom with +/- and recenter with Home. Tab to a person, open the preview with Enter/Space, and close it with Escape. Confirm focus returns to that card. Check reduced-motion mode.
7. As Viewer, confirm no add-person/add-relationship actions appear. Check an empty archive. As Editor, confirm Add relationship names/uses the selected person and existing backend checks still apply.
8. For an existing valid private portrait path, verify the image; for a missing/unavailable portrait, verify initials. Check long names and approximate/unknown dates in the preview without clipping.

Production is not part of this review step; visual acceptance remains pending before merge.
