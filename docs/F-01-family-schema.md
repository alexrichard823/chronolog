# F-01 Family Schema

This task introduces the two top-level tables required for private family spaces.

## `families`

Stores each private family archive/workspace.

Key fields:
- `id`: UUID primary key
- `name`: required family name
- `description`: optional description
- `cover_image_path`: optional private Supabase Storage object path
- `created_by`: authenticated user who created the family
- `created_at` / `updated_at`: audit timestamps

## `family_memberships`

Maps authenticated users to family archives and stores the user's role.

Supported MVP roles:
- `owner`
- `admin`
- `editor`
- `viewer`

Constraints:
- A user can belong to a family only once.
- A family can have at most one `owner` membership.
- Memberships are deleted when a family is deleted.
- Memberships are deleted if the linked auth user is deleted.

Indexes cover membership lookups by user/family and family creator lookups.

RLS is enabled immediately on both public tables. Membership-aware RLS policies are intentionally deferred to the next authorization task, so the tables remain closed through the public API until those policies are added.
