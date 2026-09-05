# Chronolog MVP Bugs & Improvements Tracker

> **Authoritative running tracker** for bugs, usability issues, security follow-ups, enhancements, product risks, and technical debt discovered while building and testing Chronolog.

This file is the single source of truth for follow-up items that should not be lost between development phases or chat sessions.

Statuses: **Open**, **Planned**, **In progress**, **Completed**, **Deferred**, **Won't do**.  
Priorities: **Critical**, **High**, **Medium**, **Low**.

## Unresolved items

| ID | Type | Priority | Status | Item | Notes |
| --- | --- | --- | --- | --- | --- |
| IMP-001 | Security | Medium | Deferred | Enable Supabase leaked-password protection | Requires Supabase Pro; current MVP retains 12-character password minimum. Revisit on plan upgrade. |
| IMP-004 | Events & Stories / UX | Medium | Open | Show only date fields relevant to selected date type | Dynamically show Exact, Approximate, Range, or Unknown inputs. |
| IMP-006 | Email / Deliverability | Low | Planned | Move authentication email to a dedicated sending subdomain | Future `auth.getchronolog.com`; keep marketing mail separate. |
| IMP-007 | Tree / Architecture | High | Open | Replace full-family tree fetch with focal-neighborhood queries | Current tree fetch scales with entire archive instead of visible depth. |
| IMP-008 | Tree / Build | Medium | Open | Verify `@memoir/tree` is explicitly locked as a root dependency | Ensure deterministic clean installs. |
| IMP-009 | Security / Surface Area | Medium | Open | Remove or protect public `/tree-prototype` | Prototype should not remain public for broad launch. |
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

## Completed items

| ID | Type | Priority | Status | Item | Completion notes |
| --- | --- | --- | --- | --- | --- |
| IMP-002 | UX / Permissions | Medium | Completed | Hide all mutation controls from Viewer accounts | Production role regression confirmed Viewer can read family content but cannot create/edit/delete. Backend permissions remain authoritative. |
| IMP-003 | Relationships / UX | High | Completed | Allow existing relationships to be edited or removed | Implemented in Phase 8.5 with validation retained. |
| IMP-005 | Accessibility / Visual Design | High | Completed | Improve problematic dark-theme text contrast | Phase 10 stabilized MVP on an accessible light scheme. |
| IMP-010 | Data Safety | High | Completed | Add safer archive deletion recovery | Replaced immediate hard deletion with exact-name confirmation, a 30-day Owner-only recovery window, immediate membership/access removal, full membership restoration, and a separately confirmed permanent-delete path. |
| IMP-021 | Email / Reliability | High | Completed | Replace Supabase default email delivery with Resend SMTP | Resend SMTP configured and invitation delivery tested. |
| IMP-022 | Email / Permissions | High | Completed | Fix Edge Function access to invitation records | Service role can read invitation records; normal users still cannot directly access them. |
| IMP-023 | Domain / Auth | High | Completed | Make `getchronolog.com` canonical production/auth origin | Vercel domain, Supabase Site URL/redirects, app origin, and Edge Function updated. |
| IMP-024 | Legal / Pilot | High | Completed | Add Privacy Policy and Terms | `/privacy` and `/terms` deployed and linked. |
| IMP-025 | Error Handling | Medium | Completed | Add friendly application error state | Added production-friendly error UI. |
| IMP-026 | Metadata / Branding | Low | Completed | Replace default Next.js metadata | Chronolog metadata now used. |
| IMP-027 | Collaboration / Security | High | Completed | Secure invitations and access removal | Hashed/expiring/one-time invitations; email match; access revocation tested. |
| IMP-028 | Relationship Integrity | High | Completed | Prevent self-parenting, duplicates, and ancestry cycles | Manual acceptance passed for self-link, duplicates, two-person/deep cycles, and loop-creating edits. |
| IMP-029 | Auth / UX | High | Completed | Existing-account registration attempt should prompt login | Fixed in PR #31 and manually verified in production. |
| IMP-030 | Relationships / Permissions | High | Completed | Relationship edits fail when changing spouse status/type/participants | Fixed in PR #31 by granting intended relationship identity-column updates while preserving RLS and validation; manually verified. |
| IMP-031 | Media / Browser Compatibility | High | Completed | Chrome blocks embedded PDF preview | Fixed in PR #32 by removing the unnecessary iframe sandbox while preserving private short-lived signed URLs; manually verified in Chrome. |
| IMP-032 | Collaboration / Permissions | High | Completed | Shared member visibility with Owner-only management | All current family members can view current members, roles, invitations, and collaboration activity. Only the Owner can invite, revoke, change roles, or remove another member; non-Owners may leave the family themselves. UI and backend RPC enforcement were updated. |
| IMP-033 | Collaboration / Permissions | High | Completed | Owner invitation rejected after Owner-only member-management change | Reworked invitation authorization so the database is the single membership authority. Service-role-only delivery context verifies token, pending/expiry state, and that the inviter is still Owner. Edge Function v6 removed the brittle duplicate session-role authorization. Production Owner invitation test passed. |
| IMP-034 | Collaboration / Email | High | Completed | Existing-account invitation delivery was inferred from Auth errors | Edge Function v6 now determines account existence/password state through a service-role-only database RPC and selects existing-user OTP vs new-user invite deterministically. Production existing-account invitation test passed. |

## Pilot launch gates

| Gate | Status | Notes |
| --- | --- | --- |
| Production custom domain and Auth URL configuration | Completed | `getchronolog.com` canonical and fresh invitation remained on custom domain. |
| Transactional email delivery | Completed | Resend SMTP configured and tested. |
| Two-account collaboration acceptance test | Completed | Invite, contribute, remove, revoke passed; Owner-only membership management regression subsequently passed. |
| Mobile browser smoke test | Completed | Mobile navigation, person/event/story editing, tree controls, media viewing, responsive forms/actions, destructive confirmation UI, Privacy, and Terms passed after IMP-029/030 fixes. |
| Upload boundary/error test | Completed | Valid image/PDF/audio/video, unsupported types, size limits, linking, deletion, and PDF browser preview all passed after IMP-031 fix. |
| Role/permission regression test | Completed | Owner manages membership/settings/content; Admin manages content/settings but only views membership; Editor can CRUD content but not members/archive settings; Viewer is read-only. Owner invitation delivery works through Edge Function v6. |
| Archive deletion recovery decision | Completed | IMP-010 adds a 30-day recovery window with Owner-only restore and permanent deletion. |
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
- **2026-08-28** — Added IMP-031 after Chrome blocked embedded PDF previews during upload QA, then marked it complete after successful production re-test.
- **2026-08-28** — Added and implemented IMP-032: shared member/invitation visibility with Owner-only membership management.
- **2026-08-28** — Added IMP-033/034 after Owner invitation regression; replaced duplicated Edge authorization and Auth-error inference with database-authoritative delivery context in Edge Function v6.
- **2026-08-28** — Marked IMP-002, IMP-033, IMP-034, and the role/permission regression gate completed after production verification across Owner/Admin/Editor/Viewer.
- **2026-09-03** — Completed IMP-010/BF-02 with recoverable archive deletion, immediate access removal, Owner-only restoration, and separately confirmed permanent deletion.
