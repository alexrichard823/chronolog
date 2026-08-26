# Chronolog MVP Bugs & Improvements Tracker

> Running action tracker for bugs, usability issues, security follow-ups, enhancements, and technical improvements discovered while building and testing the Chronolog MVP.

## How to use this tracker

Add an item whenever a bug, enhancement, security concern, UX improvement, technical debt item, or other worthwhile follow-up is discovered during development or testing.

Each item should stay on this list until it is either:

- **Completed** — implemented and verified.
- **Deferred** — intentionally moved beyond the MVP.
- **Won't do** — reviewed and intentionally rejected.

Before pilot launch and again before declaring the MVP complete, review every open item and decide whether it must be completed, deferred, or rejected.

### Status values

- **Open** — discovered and not yet addressed.
- **Planned** — agreed to do, but not started.
- **In progress** — currently being implemented.
- **Completed** — implemented and verified.
- **Deferred** — intentionally postponed.
- **Won't do** — intentionally rejected after review.

### Priority values

- **Critical** — blocks safe or functional use.
- **High** — should be resolved before pilot/MVP launch.
- **Medium** — meaningful UX, reliability, or maintainability improvement.
- **Low** — polish or optional enhancement.

---

## Open items

| ID | Type | Priority | Status | Found during | Item | Explanation / Acceptance Notes |
| --- | --- | --- | --- | --- | --- | --- |
| IMP-001 | Security | High | Open | Phase 6 review | Enable Supabase leaked-password protection before pilot | Supabase Auth's leaked-password protection is currently disabled. Before inviting pilot users, enable the feature so compromised passwords are checked against known breached-password data. This is a pre-pilot security requirement, not a Phase 6 functional blocker. |
| IMP-002 | UX / Permissions | Medium | Open | Phase 6 review | Hide mutation controls from Viewer accounts | Database RLS already prevents Viewer accounts from creating or modifying protected family content, but controls such as **Add Event** and **Add Story** may still be visible. Hide actions that the current role cannot perform while retaining backend/RLS enforcement as the real security boundary. |
| IMP-003 | Relationships / UX | High | Open | Phase 6 testing | Allow existing relationships to be edited or removed | After a relationship is created, users currently cannot correct it if the relationship type or linked person is wrong. Add relationship edit and delete/remove controls with the same role authorization and validation used for relationship creation. This also closes an explicit PRD requirement to remove incorrect relationships. |
| IMP-004 | Events & Stories / UX | Medium | Open | Phase 6 testing | Show only date fields relevant to the selected date type | The Event and Story forms currently display exact-date, approximate-year, and date-range inputs at the same time. When the user chooses a date type/precision, dynamically show only the inputs required for that choice (for example, Exact → one date field; Approximate → approximate date/year fields; Range → start/end fields; Unknown → no date input). This should reduce clutter and prevent users from entering conflicting date values. |
| IMP-005 | Accessibility / Visual Design | High | Open | Phase 6 testing | Improve text contrast in the dark color scheme | Some descriptive and secondary text uses dark gray tones against the black background, making content difficult to read. Audit dark-mode text, labels, helper text, metadata, placeholders, disabled states, and muted descriptions and increase contrast so important text remains clearly readable. Use a consistent text-color hierarchy and target accessible contrast levels rather than fixing individual screens ad hoc. |

---

## Completed items

_No tracked items completed yet._

---

## MVP review checkpoints

### Before pilot users

Review every **Critical** and **High** priority open item. Do not start the pilot with unresolved security or data-access issues.

### Before MVP completion

Review all remaining open items and make an explicit decision for each: **Complete**, **Defer**, or **Won't do**.

---

## Change log

- **2026-08-26** — Tracker created after Phase 6 functional acceptance. Added Supabase leaked-password protection and Viewer-role UI permission improvements.
- **2026-08-26** — Added relationship edit/remove support and conditional date-field rendering for Event and Story forms based on Phase 6 testing feedback.
- **2026-08-26** — Added a dark-theme accessibility improvement to increase text/background contrast and establish a consistent readable text hierarchy across the app.
