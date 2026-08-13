<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Chronolog repository guidance

## Product scope

- Read `docs/PRD.md` before planning or implementing work. Build the private, collaborative, responsive family-history MVP described there; do not add excluded or post-MVP features unless the task explicitly requires them.
- Keep the product story-first, private by default, accessible across generations, and tolerant of approximate, incomplete, unknown, or disputed information.

## Privacy and authorization

- Treat every family record and uploaded file as private. A user may access family data only through a current family membership and within the capabilities of that membership's role.
- Enforce authorization in the backend and database for every read and mutation; hidden controls or client-side checks are never sufficient. Removed members must lose access immediately, and users must not change their own roles.
- Never expose privileged credentials, service-role keys, secrets, or private storage URLs in browser code, logs, commits, fixtures, screenshots, or pull requests.

## Supabase security

- Enable and maintain Row Level Security on every table containing family-owned or user data. Policies must scope access through family membership and enforce Owner, Admin, Editor, Contributor, and Viewer permissions as applicable.
- Keep Supabase Storage buckets private, validate upload type and size, and serve files only through short-lived authorized URLs.
- Use the anon key in the browser only. Keep service-role operations in trusted server-only code, minimize their use, and still perform explicit authorization checks before privileged actions.
- Review schema, policy, function, trigger, and storage changes for cross-family access, privilege escalation, and `SECURITY DEFINER` or search-path risks.

## Architecture constraints

- Use TypeScript, Next.js/React, PostgreSQL through Supabase, Supabase Auth, and private Supabase Storage unless the task explicitly changes the approved stack.
- Model people, relationships, events, stories, places, and media as separate relational records connected through explicit relationships. The tree, timeline, profiles, and archive are views of this same data, not separate stores.
- Preserve date precision and uncertainty rather than inventing exact dates. Enforce relationship invariants such as no self-links, duplicates, obvious ancestry cycles, or assumptions that every spouse is a parent.
- Keep privileged logic and secrets server-side. Prefer server-enforced invariants and authorization over duplicated client-only logic.

## Task discipline

- Make the smallest focused change that satisfies the request. Avoid unrelated edits, dependency upgrades, broad refactors, generated-file churn, and speculative features.
- Follow existing patterns and inspect the relevant current Next.js 16 documentation noted above before changing framework code.
- Do not weaken privacy, authorization, validation, or audit behavior to make a feature or test pass.

## Required verification

- Run `npm run lint` and `npm run build` for code changes.
- Run relevant focused tests or security checks for the affected behavior, especially authorization policies and multiple-role or cross-family access when data access changes.
- Run `git diff --check`, review the complete diff, and confirm only intended files changed before committing.
- If a required command cannot run, document the command, failure, and environment limitation in the pull request.

## Pull requests

- Keep each pull request focused and explain the user-visible behavior, architecture or data-model impact, and privacy or authorization impact.
- List the exact verification commands and results. Call out migrations, RLS or storage-policy changes, environment or deployment steps, known limitations, and follow-up work.
- Never include real family data, personal information, privileged credentials, or secrets in the change, test evidence, or pull-request text.
