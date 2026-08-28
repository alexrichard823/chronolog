-- Phase 10 mobile QA bug fix: the edit form can change relationship type and
-- participants, but authenticated editors previously lacked UPDATE privilege on
-- those columns. RLS still requires can_edit_family(), and existing constraints
-- and triggers continue to enforce self-link, duplicate, canonical-spouse, and
-- ancestry-cycle validation.

grant update (
  relationship_type,
  person_a_id,
  person_b_id
) on table public.relationships to authenticated;
