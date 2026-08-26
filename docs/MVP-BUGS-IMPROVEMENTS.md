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
