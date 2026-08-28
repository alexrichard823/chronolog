# Chronolog MVP Bugs & Improvements Tracker

> **Authoritative running tracker** for bugs, usability issues, security follow-ups, enhancements, product risks, and technical debt discovered while building and testing Chronolog.

This file is the single source of truth for follow-up items that should not be lost between development phases or chat sessions.

## How this tracker is maintained

Add an item whenever development, testing, architecture review, pilot feedback, or user feedback reveals a worthwhile follow-up.

Each item remains here until it is explicitly marked:

- **Completed** — implemented and verified.
- **Deferred** — intentionally postponed beyond the current MVP/pilot scope.
- **Won't do** — reviewed and intentionally rejected.

Before pilot launch and again before declaring the MVP complete, review every unresolved item.

### Status values

- **Open** — discovered and not yet addressed.
- **Planned** — agreed to do, but not started.
- **In progress** — currently being implemented.
- **Completed** — implemented and verified.
- **Deferred** — intentionally postponed.
- **Won't do** — intentionally rejected.

### Priority values

- **Critical** — blocks safe or functional use.
- **High** — should normally be resolved before pilot/MVP launch.
- **Medium** — meaningful UX, reliability, performance, or maintainability improvement.
- **Low** — polish or optional enhancement.

---

## Unresolved items

| ID | Type | Priority | Status | Found during | Item | Explanation / Acceptance Notes |
| --- | --- | --- | --- | --- | --- | --- |
| IMP-001 | Security | Medium | Deferred | Phase 6 review / Phase 10 pilot | Enable Supabase leaked-password protection when the project moves to Supabase Pro | Supabase Security Advisor flags leaked-password protection as disabled, but enabling HaveIBeenPwned checks requires a Supabase Pro plan. The MVP already enforces a 12-character password minimum. Do not upgrade solely for this feature; enable it when Chronolog moves to Pro or when scale/risk justifies the plan upgrade. |
| IMP-002 | UX / Permissions | Medium | Open | Phase 6 review | Hide all mutation controls from Viewer accounts | RLS is the actual security boundary, but Viewer accounts should not see create/edit/delete controls they cannot use. Audit People, Relationships, Events, Stories, Media, and family actions for role-aware UI. |
| IMP-004 | Events & Stories / UX | Medium | Open | Phase 6 testing | Show only date fields relevant to the selected date type | Exact, approximate, range, and unknown date inputs should conditionally display only the fields that apply. This reduces form clutter and conflicting input. |
| IMP-006 | Email / Deliverability | Low | Planned | Phase 9 email setup | Move authentication email to a dedicated sending subdomain | Before meaningful scale or marketing email, move auth mail to a dedicated sending subdomain such as `auth.getchronolog.com`, with marketing email on a separate sending domain/subdomain to isolate sender reputation. Current Resend SMTP on `getchronolog.com` is acceptable for MVP/pilot. |
| IMP-007 | Tree / Architecture | High | Open | Phase 8 tree review | Replace full-family tree fetch with focal-neighborhood queries | The tree currently loads all family people/relationships server-side and limits only the rendered graph. The architecture expects bounded focal-person graph queries. Fix before large real-family archives so tree cost and latency scale with visible depth rather than total archive size. |
| IMP-008 | Tree / Build | Medium | Open | Phase 8 tree review | Verify `@memoir/tree` is explicitly locked as a root dependency | Earlier review found the tree package missing from the root lockfile/dependency declaration. Verify current `package.json`/`package-lock.json` and add the explicit dependency if still missing so clean installs are deterministic. |
| IMP-009 | Security / Surface Area | Medium | Open | Phase 8 tree review | Remove or protect the public `/tree-prototype` route | The tree spike/prototype should not remain publicly reachable in the production pilot unless intentionally kept. Remove it or gate it before broad launch. |
| IMP-010 | Data Safety | High | Open | Phase 8.5 / architecture review | Add safer archive deletion recovery | Archive deletion is currently a hard delete. Before valuable real-family data accumulates, add Owner re-authentication and preferably soft-delete/recovery with a delayed purge or equivalent recoverability. Pilot decision must be explicit if this remains hard delete. |
| IMP-011 | Environment / Data Safety | High | Open | Phase 10 pilot readiness | Separate Preview/testing from the production Supabase backend | Vercel Preview deployments currently share the production Supabase backend. Before continued development against real pilot data, create a separate Preview/staging backend or equivalent isolation so testing cannot mutate production family archives. |
| IMP-012 | Auth / Redirects | Low | Open | Phase 10 custom-domain setup | Tighten Supabase Auth redirect allowlist | Current pilot configuration includes broad `/**` rules for `getchronolog.com` and the legacy Vercel domain. Replace broad wildcards with only the exact callback/invitation paths required once the custom-domain transition is fully verified. |
| IMP-013 | Media / Product | Medium | Deferred | Phase 7 media testing | Increase practical video upload capacity | MVP currently limits video/audio to 25 MB. This is intentionally conservative but too small for many family videos. Revisit storage quotas, resumable uploads, compression/transcoding, and billing before increasing the limit. Surface a clear file-too-large message in the meantime. |
| IMP-014 | Media / Cost | Medium | Planned | PRD architecture review | Add thumbnail/derivative strategy and storage quotas | As archives grow, generate image/video thumbnails and set reasonable per-family/user storage expectations. This reduces bandwidth and protects Supabase Storage cost. Not required for the small pilot but needed before scale. |
| IMP-015 | Performance | Medium | Planned | PRD architecture review | Add pagination/lazy loading to growing archive views | People, media, timeline, and activity lists should avoid unbounded reads as archives grow. Introduce pagination or cursor-based loading where required after pilot data reveals realistic collection sizes. |
| IMP-016 | Product / Data Quality | Medium | Planned | PRD architecture review | Add likely-duplicate person warnings | Current relationship creation blocks exact duplicate relative creation in important flows, but broader likely-duplicate warnings are still needed. Automatic merging remains out of MVP scope. |
| IMP-017 | Product / Portability | Medium | Deferred | PRD privacy requirements | Add family archive export | PRD states Owners should eventually be able to export family content. Define an export format covering people, relationships, events, stories, media metadata, and media files before broader launch. |
| IMP-018 | Product / Brand | Low | Open | Phase 10 launch review | Perform a formal Chronolog name/domain collision check | `Chronolog` is used by other products/organizations. Before significant marketing spend, perform a proper trademark/name collision review and decide whether branding needs adjustment. The current product domain is `getchronolog.com`. |
| IMP-019 | Homepage / Onboarding | Medium | Open | Phase 10 pilot readiness | Improve first-time onboarding beyond the minimal landing page | The homepage now has correct Chronolog branding, auth entry points, Privacy Policy, and Terms, but pilot feedback should drive a clearer first-use journey and archive setup guidance. |
| IMP-020 | Reliability / Operations | Medium | Planned | Phase 10 pilot readiness | Define production monitoring and restore procedure | Before meaningful real-family usage, document how to detect auth/database/storage failures, inspect logs, and restore from Supabase backups where available. Run at least one restore/recovery drill when the infrastructure tier supports it. |

---

## Completed items

| ID | Type | Priority | Status | Found during | Item | Completion Notes |
| --- | --- | --- | --- | --- | --- | --- |
| IMP-003 | Relationships / UX | High | Completed | Phase 6 testing | Allow existing relationships to be edited or removed | Implemented and manually validated during the Phase 8.5 content-management/security work. Relationship edits retain self-link, duplicate, and ancestry-cycle validation. |
| IMP-005 | Accessibility / Visual Design | High | Completed | Phase 6 testing | Improve text contrast in the dark color scheme | Phase 10 stabilized the MVP on an accessible light color scheme, eliminating the problematic dark-mode contrast state for the pilot. |
| IMP-021 | Email / Reliability | High | Completed | Phase 9 collaboration | Replace Supabase default email delivery with Resend SMTP | Resend domain authentication was verified and Supabase custom SMTP configured. New-user invitation delivery was manually tested successfully after the built-in Supabase mailer rate limit blocked the original flow. |
| IMP-022 | Email / Permissions | High | Completed | Phase 9 collaboration | Fix Edge Function access to invitation records | Granted read-only `service_role` access required by the protected invitation delivery Edge Function while keeping direct anon/authenticated access blocked. Invitation delivery then passed. |
| IMP-023 | Domain / Auth | High | Completed | Phase 10 pilot readiness | Make `getchronolog.com` the production application/auth origin | Vercel custom domain is active, Supabase Site URL was changed to `https://getchronolog.com`, redirect URLs were added, application invitation origin was updated, and invitation Edge Function v3 allows the custom domain. |
| IMP-024 | Legal / Pilot | High | Completed | Phase 10 pilot readiness | Add pilot Privacy Policy and Terms pages | Added `/privacy` and `/terms`, linked them from the homepage, and deployed them to production. |
| IMP-025 | Error Handling | Medium | Completed | Phase 10 pilot readiness | Add a friendly application-level error state | Added a user-facing application error screen so unexpected failures do not fall through to a raw/default framework experience. |
| IMP-026 | Metadata / Branding | Low | Completed | Phase 10 pilot readiness | Replace default Next.js metadata | Replaced `Create Next App` / generated metadata with Chronolog title, description, and application metadata. |
| IMP-027 | Collaboration / Security | High | Completed | Phase 9 collaboration | Secure invitation acceptance and access removal | Invitation tokens are hashed, expiring and one-time; invite email must match the authenticated account; replay fails; removed members lose new archive/storage access. Full second-account acceptance test passed. |
| IMP-028 | Relationship Integrity | High | Completed | Phase 8.5 validation | Prevent self-parenting, duplicate relationships, and ancestry cycles | Self-parent, duplicate parent-child/spouse relationships, two-person cycles, deep ancestry cycles, and relationship edits that create loops were implemented and manually validated. |

---

## Pilot launch gates

These are not necessarily bugs; they are the remaining conditions from the PRD that must be satisfied before calling the MVP/pilot complete.

| Gate | Status | Notes |
| --- | --- | --- |
| Production custom domain and Auth URL configuration | Completed | `getchronolog.com` is canonical. |
| Transactional email delivery | Completed | Resend SMTP configured and invitation test passed. |
| Two-account collaboration acceptance test | Completed | Editor invite, contribution, shared visibility, removal, and access revocation passed. |
| Mobile browser smoke test | Open | Test primary flows on at least one iPhone/Safari-sized viewport and one Android/Chrome-sized viewport or equivalent devices. |
| Upload boundary/error test | Open | Verify supported types, unsupported types, max-size rejection, interrupted/failing upload behavior, and successful photo/audio/video/PDF upload. |
| Role/permission regression test | Open | Reconfirm Owner/Admin/Editor/Viewer visible controls plus backend enforcement after final pilot changes. |
| Archive deletion recovery decision | Open | Resolve IMP-010 or explicitly accept the pilot risk. |
| Preview/production data separation | Open | Resolve IMP-011 before development continues against valuable real-family production data. |
| One real-family unassisted pilot | Open | PRD Definition of Done requires at least one real family to use Chronolog successfully. |

---

## MVP review checkpoints

### Before pilot users

Review every **Critical** and **High** unresolved item. Any intentionally accepted High-priority risk must have a written decision in this tracker.

### Before MVP completion

Review every remaining unresolved item and explicitly choose **Complete**, **Defer**, or **Won't do**.

---

## Change log

- **2026-08-26** — Tracker initially created after Phase 6 functional acceptance.
- **2026-08-26** — Added relationship editing, conditional date fields, and text-contrast follow-ups.
- **2026-08-28** — Added dedicated authentication email subdomain enhancement after configuring Resend.
- **2026-08-28** — Expanded the file into the authoritative project-wide bugs/improvements tracker. Added all known architecture, pilot, performance, media, security, product, and technical-debt items; reconciled completed Phase 8.5–10 work; deferred leaked-password protection because Supabase requires Pro; and added explicit pilot launch gates.
