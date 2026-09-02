# Chronolog PRD Amendments

This file records approved product decisions that supersede conflicting language in `docs/PRD.md` until the next consolidated PRD revision.

## 2026-09-02 — Family member visibility and management

Approved behavior:

- Every current member of a family archive — Owner, Admin, Editor, or Viewer — can open the Family Members screen.
- Every current member can see the archive's current members, their roles, and pending/previous invitations.
- Owners and Admins can invite members, select an invitee's initial role, revoke invitations, or remove another non-Owner member.
- Non-Owner members may leave the family themselves.
- Only the Owner can change an existing member's role, transfer ownership, or remove/demote the Owner.
- Backend authorization must enforce these rules; hiding controls in the UI is not sufficient.

This decision supersedes the temporary 2026-08-28 Owner-only membership-management rule. Admins manage invitations and ordinary member removal, while existing role changes and ownership remain Owner-controlled. Application and database authorization must be updated and re-tested before this behavior is considered implemented.
