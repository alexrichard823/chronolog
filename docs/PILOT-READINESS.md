# Chronolog Pilot Readiness

This checklist implements Phase 10 of the MVP PRD: mobile testing, permission testing, upload testing, error handling, privacy policy, terms, and pilot onboarding. The Phase 10 gate is one real family using Chronolog without developer assistance.

## Automated / implementation readiness

- [x] Production domain purchased and connected: `https://getchronolog.com`.
- [x] Transactional email moved from Supabase built-in mailer to Resend SMTP.
- [x] Family invitation code uses the custom production domain.
- [x] Privacy policy page exists at `/privacy`.
- [x] Terms page exists at `/terms`.
- [x] Homepage links to Privacy and Terms.
- [x] Production metadata identifies Chronolog instead of default Next.js metadata.
- [x] Friendly application-level error state added.
- [x] Consistent light color scheme and focus treatment added for pilot accessibility.
- [x] Private media uses short-lived signed URLs (5-minute TTL).
- [x] Upload UI validates supported formats and per-type size limits before upload.
- [x] Invitation/member permission path has passed two-account manual acceptance testing.
- [x] Supabase Auth Site URL is `https://getchronolog.com` and custom-domain redirect URLs are configured.
- [x] Supabase leaked-password protection reviewed; deferred because HaveIBeenPwned integration requires Supabase Pro. The MVP retains its 12-character password minimum.

## Must complete before first real-family pilot

- [x] Verify a fresh invitation email link opens on `getchronolog.com` and completes acceptance after the Site URL change.
- [x] Run the mobile browser smoke test below on at least one real mobile browser; all listed checks passed after fixing the registration and relationship-edit issues discovered during testing.
- [x] Run upload boundary tests below; all listed checks passed after fixing the Chrome PDF preview issue.
- [x] Run the permission smoke test below across Owner, Admin, Editor, and Viewer after the Owner-only membership-management change.
- [ ] Run the complete two-account MVP acceptance test on the release candidate.
- [ ] Decide whether the current immediate archive-delete implementation is acceptable for the first pilot or implement the architecture-recommended re-auth + recovery window first.
- [ ] Establish a separate Preview/testing backend before development resumes against real pilot data.
- [ ] Confirm database backup/restore and media recovery approach before making preservation guarantees.

## Mobile browser smoke test

Test at narrow mobile width and normal desktop width.

1. Register/login and reach Families.
2. Create/open a family.
3. Navigate People, Timeline, Tree, Media, and Members where role permits.
4. Add and edit a Person.
5. Add and edit an Event and Story.
6. Open the tree and confirm pan/zoom/navigation remain usable without trapping the page.
7. Open a media item and confirm image/audio/video/PDF presentation is usable.
8. Confirm forms do not overflow horizontally and primary actions remain reachable.
9. Confirm destructive confirmation UI remains understandable on a small screen.
10. Confirm Privacy and Terms pages are readable on mobile.

**Result:** Passed on 2026-08-28 after IMP-029 and IMP-030 were fixed and manually re-tested in production.

## Permission smoke test

Use Owner plus Admin, Editor, and Viewer accounts.

- Owner can manage members, archive settings, and family content.
- Admin can manage family content and family settings, but can only view members/invitations; membership management is Owner-only.
- Editor can create/edit/delete family content but cannot manage members or archive settings.
- Viewer can read family content but cannot mutate it.
- Every current member can view the Family Members screen and see current members, roles, and invitations.
- Removed member loses family/database access immediately.
- Removed member cannot obtain new private-media access.
- An already-issued signed media URL may remain usable only until its short TTL expires.

**Result:** Passed on 2026-08-28 after the Owner-only membership-management amendment and invitation-delivery architecture were manually re-tested in production. Owner invitation delivery, Admin/Editor/Viewer visibility, content permissions, and Viewer read-only behavior passed.

## Upload boundary test

Supported MVP formats:

- Images: JPG, PNG, WebP — maximum 10 MB.
- PDFs: PDF — maximum 10 MB.
- Audio: MP3, M4A, WAV — maximum 25 MB.
- Video: MP4, MOV, WebM — maximum 25 MB.

For each representative type:

1. Upload a small valid file and confirm it displays/plays.
2. Attempt an unsupported extension/type and confirm the UI rejects it.
3. Attempt a file just over the configured limit and confirm the UI rejects it before upload.
4. Confirm a successful media item can link to people/events/stories.
5. Confirm deleting the media item removes active access to the object.

**Result:** Passed on 2026-08-28. Image, PDF, audio, and video uploads worked; unsupported and oversize files were rejected; linking and deletion worked; Chrome PDF preview was fixed in IMP-031 and successfully re-tested.

## Pilot onboarding script

Give the pilot family only the product URL and this short objective:

> Create your private family archive, add a few relatives, connect them, preserve one meaningful family event or story, attach at least one piece of media, explore the timeline/tree, and invite another relative to contribute.

Do not explain each screen unless they become blocked. Record:

- First point of confusion.
- Any terminology they do not understand.
- Any action they expected but could not find.
- Mobile-specific friction.
- Upload failures or unclear limits.
- Permission/invitation confusion.
- Whether they can rediscover the story through a profile, timeline, and tree.

The Phase 10 gate passes when one real family completes the core journey without developer assistance and all critical/high pilot blockers are resolved or explicitly accepted.
