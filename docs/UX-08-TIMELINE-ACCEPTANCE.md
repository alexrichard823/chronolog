# Timeline search and visual refresh

Status: Implemented for preview review; manual acceptance pending.
Scope: Alex’s September 8 timeline request within the UI/UX Revamp. This does not complete every potential UX-08 item.

## Behavior

- Search the existing family people by partial name, ignoring case and accents. Select a matching person; a uniquely matching typed name can also be applied directly.
- Multiple matches require an explicit selection. Unmatched text shows a helpful error and never silently clears the person filter.
- Event type remains a dropdown populated by types used in this family. Person and type filters combine.
- Apply filters uses the shared green primary button and press styling, shows Applying while navigating, and confirms Filters applied after the requested results arrive.
- Applied filter chips show the current results. Clear filters returns to all-family results.
- Filtering resets pagination to page one. Pagination and browser navigation preserve URL-backed filters.
- The vertical layout remains, with rounded white cards, green timeline markers and type/person accents, clearer date/place metadata, linked story/media previews, and View event actions.
- Approximate and ranged date labels remain explicit; undated events get a section label.
- Creation controls follow Owner/Admin/Editor permissions. Viewers retain read-only navigation.
- Failed main filter/event requests surface the existing error UI rather than a false empty state.

## Quick acceptance (desktop, then phone)

1. Open a family’s Timeline. Type part of a person’s name and select the result. Apply filters. Confirm the button visibly responds and only that person’s events appear.
2. Select an event type and apply. Confirm every result matches both the person and event type; check the applied chips and count.
3. Clear filters. Confirm the search and event type reset and all events return. Apply unchanged filters once to confirm the button still responds.
4. Try an unmatched name, multiple matching names, and a person with no events. Confirm helpful messages and no unintended all-family results.
5. Use arrow keys and Enter to choose a person; Escape dismisses suggestions. Tab through the controls and confirm visible focus. On a phone, tap a search result and the type dropdown and confirm both work without overlapping controls or horizontal scrolling.
6. Open an event, linked person, story, and media. Confirm they reach the expected records. Check long text and cards with/without linked content.
7. If there are more than 25 matching events, use Next/Previous, refresh, and browser Back/Forward. Confirm filter values and results stay aligned.
8. Check exact, approximate, ranged, and unknown dates. Confirm the entered dates and oldest-to-newest order remain intact.
9. With a Viewer test account, confirm Add event is absent while search and links still work.

## Verification

- `npm run lint` — passed.
- `npm run build` — passed.
- `node --experimental-strip-types --test tests/timeline/timeline.test.mjs` — 9 passed. Uses fictional records and the real server page with an in-memory query double; covers search, combined filters, pagination, uncertainty, linked content, membership/roles, and query failures.
- `git diff --check` — passed.
- The local build initially rejected dependencies symlinked outside the checkout; copying dependencies into the checkout resolved that environment issue without changing package files.
- Cloud browser local access failed with `net::ERR_BLOCKED_BY_CLIENT`. Automated real-browser visual, touch, and authenticated end-to-end acceptance is not claimed. Complete the preview checklist above.

No migrations, dependency changes, auth changes, storage-policy changes, or environment changes are required. All queries remain family scoped and use the existing member-session client and RLS. The added membership read matches the existing family/tree permission pattern; backend creation authorization is unchanged.

Existing full-family people loading, the 1,000-row event-type lookup, and event-centric rendering are retained. Standalone story/media entries and date-range filtering are outside this request.
