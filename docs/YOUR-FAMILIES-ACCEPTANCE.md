# Your Families page revamp

Status: Reviewed by Alex; production release authorized on September 8, 2026.

## Scope

- Post-login `/families` only, with the approved C brand and shared design tokens/primitives.
- Whole family cards open their archive. Larger names replace descriptions and the redundant Open family text.
- Card names retain the word Family, appending it only when the saved name does not already contain it. Saved family names are unchanged.
- Each card shows people recorded in the archive and current Chronolog members. Pending invitations are excluded.
- Pointer press adds a subtle green fill/border; Next.js pending navigation keeps the highlight and displays an indicator with a screen-reader announcement. Native links, keyboard focus, modified clicks, and prefetching remain supported.
- Both Create family actions use the shared green primary button.
- Recently Deleted sits at the bottom right on the same row as Log out. Long lists flow above the footer; mobile headers/counts wrap.

## Data and privacy

The signed-in server client reads `id, name, people(count), family_memberships(count)` in one family query under existing RLS. No names, emails, or full person/member records are fetched for the counts. The existing signed-out redirect and archive status/error messages remain intact.

No migrations, dependencies, environment settings, grants, roles, or authorization policies change. Family descriptions remain stored and editable elsewhere.

## Verification

- `NEXT_TELEMETRY_DISABLED=1 npm run build` — passed, including TypeScript. The initial scratch dependency symlink was outside Turbopack's root; using a local dependency copy resolved it.
- `npx --no-install eslint src/app/families/page.tsx src/app/families/family-card.tsx src/app/families/logout-button.tsx` — passed.
- `npm run lint` — six existing errors and seven warnings in the unchanged error page/tree files, matching the previous release.
- `git diff --check` — passed.
- Temporary React server-render checks — passed for full-card URLs, missing description/Open family text, zero/singular/plural/large counts, C logo, both green Create actions, footer order, pending announcement, empty/error states, and the signed-out redirect. Next Link/useLinkStatus were stubbed; these checks do not prove browser interaction or responsive layout.
- Development database transaction, rolled back — all four roles received 3 people/4 active members despite a pending invitation; unrelated family/person/member rows were hidden; an empty archive returned 0 people/1 member; a removed member immediately lost family/person/member visibility. All fixtures were synthetic and rolled back. This verifies RLS/count semantics, not the live REST response.
- Browser attempt against an isolated local Next.js fixture was blocked by the browser environment (`ERR_BLOCKED_BY_CLIENT`). Visual, touch, and real pending-navigation acceptance remain for Preview.

## Preview acceptance

1. Sign in on desktop and phone. Confirm C branding, green Create family, larger names, counts, and no description/Open family text.
2. Compare people counts with People and member counts with Members. Check a newly created archive and an archive with pending invitations.
3. Click/tap both the card text and blank area. Confirm the correct archive opens and slow navigation visibly highlights the selected card with an indicator.
4. Tab to a card and press Enter; confirm visible focus and correct navigation. Return with browser Back and verify no stale pending state. Check opening a card in a new tab.
5. Confirm Recently Deleted is bottom right beside Log out at narrow widths, with long family names and with multiple archives.
6. Check both Create family actions, Recently Deleted, and Log out still work.

Alex reviewed the preview, approved its appearance, requested the Family-name follow-up, and then explicitly authorized moving this work to production. The latest code passed the production build, focused lint, and Vercel Preview deployment. Automated browser limitations above remain documented; the release is authorized based on the completed checks and Alex's review.
