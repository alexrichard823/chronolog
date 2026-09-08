# UX-03 Home and profile follow-up

The original persistent navigation was tested successfully by the user. This follow-up keeps that navigation and simplifies Home and person-profile controls.

## Changes

- Home has one Add dropdown with Person, Story, Event, and Media.
- A clickable current-member count sits below the family name. Pending invitations are not counted.
- Edit Archive is on the right, with the existing Owner/Admin visibility.
- A People summary shows the five most recently added people, newest first, with profile links and View all.
- Redundant header destination buttons are removed. Timeline and Tree remain in persistent navigation.
- Profiles have matching Edit and Add controls. Story, Event, and Media carry the selected person into their forms.
- Add Relationship sits in Relationships. Delete person sits at the bottom and retains its confirmation.

## Verification performed

- Production build and TypeScript check: passed.
- Focused ESLint on the Add component, Home, profile, and Event creation page: passed.
- `git diff --check`: passed.
- Temporary server-render checks using the actual pages with synthetic data: Owner/Admin/Editor/Viewer visibility, family-scoped count and people reads, five-person ordering, profile URLs, and empty/error states passed. These checks do not exercise a live database or RLS.
- Event-form preselection passed for a person in the current family; missing or other-family IDs select no one.
- Existing membership and people RLS policies reviewed; no migrations, policy changes, privileged clients, or mutations added.
- Full `npm run lint` still reports pre-existing errors in `src/app/error.tsx` and `src/app/families/[familyId]/tree/tree-view.tsx`, plus existing tree warnings.
- Browser interaction and visual checks remain pending: the cloud browser could not open the local fixture URL (`net::ERR_BLOCKED_BY_CLIENT`).

## Preview acceptance checklist

Use a family where you can edit; repeat the visibility check with a Viewer account if available.

1. **Home layout:** confirm the sidebar is unchanged; the old header destination buttons are gone; Edit Archive and Add are on the right.
2. **Add menu:** open Add and select each option. Each opens its correct form. Press Enter or Space on Add, Tab through links, and Escape to close. Clicking outside or tabbing away also closes it.
3. **Members:** click the count and compare it with current members. Pending invitations must not increase it. A one-member family should say "1 member".
4. **People:** check that Home lists at most five people in order of addition, newest first. Open a profile and View all. Adding a person should put them first after returning Home; editing an older person should not move them first.
5. **Profile:** Edit and Add match Home. Story, Event, and Media each open with that person selected. Add Relationship is in Relationships. Timeline and Tree remain accessible through persistent navigation with person context.
6. **Delete placement:** Delete person is at the bottom. Click it and cancel the confirmation; the person must remain unchanged.
7. **Roles:** Owner/Admin can Edit Archive. Editor can add content and edit profiles but cannot Edit Archive. Viewer sees the member count and People summary, but no Add, Edit, Add Relationship, or Delete controls.
8. **Phone:** check Home and a profile at narrow width, including a long name. The dropdown should open beneath Add, stay on screen, and remain usable; the persistent mobile navigation must not cover content.

Final acceptance of this follow-up is pending these Preview checks.
