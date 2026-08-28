# Chronolog PRD Amendments

This file records approved product decisions that supersede conflicting language in `docs/PRD.md` until the next consolidated PRD revision.

## 2026-08-28 — Family member visibility and management

Approved behavior:

- Every current member of a family archive — Owner, Admin, Editor, or Viewer — can open the Family Members screen.
- Every current member can see the archive's current members, their roles, and pending/previous invitations.
- Only the Owner can invite members, revoke invitations, change another member's role, or remove another member.
- Non-Owner members may leave the family themselves.
- Admins retain their content and family-settings capabilities, but no longer manage membership or invitations.
- Backend authorization must enforce these rules; hiding controls in the UI is not sufficient.

This amendment supersedes the existing PRD language that permits Admins to invite/remove members or change member roles, and the invitation flow language that says an Owner or Admin may invite relatives.
