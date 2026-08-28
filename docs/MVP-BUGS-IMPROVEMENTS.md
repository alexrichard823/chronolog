# Chronolog MVP Bugs & Improvements Tracker

> **Authoritative running tracker** for bugs, usability issues, security follow-ups, enhancements, product risks, and technical debt discovered while building and testing Chronolog.

This file is the single source of truth for follow-up items that should not be lost between development phases or chat sessions.

Statuses: **Open**, **Planned**, **In progress**, **Completed**, **Deferred**, **Won't do**.  
Priorities: **Critical**, **High**, **Medium**, **Low**.

## Unresolved items

| ID | Type | Priority | Status | Item | Notes |
| --- | --- | --- | --- | --- | --- |
| IMP-001 | Security | Medium | Deferred | Enable Supabase leaked-password protection | Requires Supabase Pro; current MVP retains 12-character password minimum. Revisit on plan upgrade. |
| IMP-002 | UX / Permissions | Medium | Open | Hide all mutation controls from Viewer accounts | RLS is authoritative; UI should also hide actions Viewers cannot perform. |
| IMP-004 | Events & Stories / UX | Medium | Open | Show only date fields relevant to selected date type | Dynamically show Exact, Approximate, Range, or Unknown inputs. |
| IMP-006 | Email / Deliverability | Low | Planned | Move authentication email to a dedicated sending subdomain | Future `auth.getchronolog.com`; keep marketing mail separate. |
| IMP-007 | Tree / Architecture | High | Open | Replace full-family tree fetch with focal-neighborhood queries | Current tree fetch scales with entire archive instead of visible depth. |
| IMP-008 | Tree / Build | Medium | Open | Verify `@memoir/tree` is explicitly locked as a root dependency | Ensure deterministic clean installs. |
| IMP-009 | Security / Surface Area | Medium | Open | Remove or protect public `/tree-prototype` | Prototype should not remain public for broad launch. |
| IMP-010 | Data Safety | High | Open | Add safer archive deletion recovery | Current hard delete should eventually use re-auth plus recovery/soft-delete. |
| IMP-011 | Environment / Data Safety | High | Open | Separate Preview/testing from production Supabase | Prevent future testing from mutating real pilot data. |
| IMP-012 | Auth / Redirects | Low | Open | Tighten Supabase Auth redirect allowlist | Replace broad `/**` rules with exact required auth/invitation paths after transition. |
| IMP-013 | Media / Product | Medium | Deferred | Increase practical video upload capacity | Current 25 MB video/audio limit is conservative; revisit quotas/resumable uploads/transcoding. |
| IMP-014 | Media / Cost | Medium | Planned | Add thumbnails/derivatives and storage quotas | Needed before scale to reduce bandwidth and storage cost. |
| IMP-015 | Performance | Medium | Planned | Add pagination/lazy loading to growing archive views | Apply to people, media, timeline, activity as archive sizes grow. |
| IMP-016 | Product / Data Quality | Medium | Planned | Add likely-duplicate person warnings | Automatic merging remains outside MVP. |
| IMP-017 | Product / Portability | Medium | Deferred | Add family archive export | PRD says Owners should eventually be able to export family content. |
| IMP-018 | Product / Brand | Low | Open | Perform formal Chronolog name/domain collision check | Complete before meaningful marketing spend. |
| IMP-019 | Homepage / Onboarding | Medium | Open | Improve first-time onboarding | Pilot feedback should drive clearer archive setup guidance. |
| IMP-020 | Reliability / Operations | Medium | Planned | Define production monitoring and restore procedure | Document outage/log/backup recovery and run a restore drill when infrastructure supports it. |
| IMP-031 | Media / Browser Compatibility | High | In progress | Chrome blocks embedded PDF preview | Phase 10 upload QA found Chrome blocking the PDF viewer because the signed PDF was rendered in a sandboxed iframe. Remove the unnecessary iframe sandbox while keeping private short-lived signed URLs and verify PDF preview/open-in-new-tab behavior. |

## Completed items

| ID | Type | Priority | Status | Item | Completion notes |
| --- | --- | --- | --- | --- | --- |
| IMP-003 | Relationships / UX | High | Completed | Allow existing relationships to be edited or removed | Implemented in Phase 8.5 with validation retained. |
| IMP-005 | Accessibility / Visual Design | High | Completed | Improve problematic dark-theme text contrast | Phase 10 stabilized MVP on an accessible light scheme. |
| IMP-021 | Email / Reliability | High | Completed | Replace Supabase default email delivery with Resend SMTP | Resend SMTP configured and invitation delivery tested. |
| IMP-022 | Email / Permissions | High | Completed | Fix Edge Function access to invitation records | Service role can read invitation records; normal users still cannot directly access them. |
| IMP-023 | Domain / Auth | High | Completed | Make `getchronolog.com` canonical production/auth origin | Vercel domain, Supabase Site URL/redirects, app origin, and Edge Function updated. |
| IMP-024 | Legal / Pilot | High | Completed | Add Privacy Policy and Terms | `/privacy` and `/terms` deployed and linked. |
| IMP-025 | Error Handling | Medium | Completed | Add friendly application error state | Added production-friendly error UI. |
| IMP-026 | Metadata / Branding | Low | Completed | Replace default Next.js metadata | Chronolog metadata now used. |
| IMP-027 | Collaboration / Security | High | Completed | Secure invitations and access removal | Hashed/expiring/one-time invitations; email match; access revocation tested. |
| IMP-028 | Relationship Integrity | High | Completed | Prevent self-parenting, duplicates, and ancestry cycles | Manual acceptance passed for self-link, duplicates, two-person/deep cycles, and loop-creating edits. |
| IMP-029 | Auth / UX | High | Completed | Existing-account registration attempt should prompt login | Fixed in PR #31 and manually verified in production: valid existing credentials on Create Account now direct the user toward Login instead of presenting the attempt as a successful signup. |
| IMP-030 | Relationships / Permissions | High | Completed | Relationship edits fail when changing spouse status/type/participants | Fixed in PR #31 by granting the intended relationship identity-column updates while preserving RLS and validation; manually verified by changing Divorced to Married successfully. |

## Pilot launch gates

| Gate | Status | Notes |
| --- | --- | --- |
| Production custom domain and Auth URL configuration | Completed | `getchronolog.com` canonical and fresh invitation remained on custom domain. |
| Transactional email delivery | Completed | Resend SMTP configured and tested. |
| Two-account collaboration acceptance test | Completed | Invite, contribute, remove, revoke passed. |
| Mobile browser smoke test | Completed | Mobile navigation, person/event/story editing, tree controls, media viewing, responsive forms/actions, destructive confirmation UI, Privacy, and Terms passed after IMP-029/030 fixes. |
| Upload boundary/error test | In progress | PDF preview bug IMP-031 found during valid-file testing; continue after fix verification. |
| Role/permission regression test | Open | Reconfirm Owner/Admin/Editor/Viewer UI plus backend enforcement. |
| Archive deletion recovery decision | Open | Resolve IMP-010 or explicitly accept pilot risk. |
| Preview/production data separation | Open | Resolve IMP-011 before development continues against valuable real-family production data. |
| One real-family unassisted pilot | Open | Required by PRD Definition of Done. |

## Maintenance rule

Whenever development, QA, architecture review, or pilot feedback reveals a real bug, enhancement, risk, or technical-debt item, add it here during the same work session. Before pilot and before MVP completion, review every unresolved High/Critical item and explicitly complete, defer, accept, or reject it.

## Change log

- **2026-08-26** — Tracker created after Phase 6 functional acceptance.
- **2026-08-28** — Expanded into the authoritative project-wide tracker and reconciled known Phase 8.5–10 work.
- **2026-08-28** — Added IMP-029 existing-account registration UX and IMP-030 relationship-edit permission failure from Phase 10 mobile QA.
- **2026-08-28** — Marked IMP-029 and IMP-030 completed after successful production verification.
- **2026-08-28** — Marked the Phase 10 mobile browser smoke-test gate completed after all remaining mobile checks passed.
- **2026-08-28** — Added IMP-031 after Chrome blocked embedded PDF previews during upload QA.
