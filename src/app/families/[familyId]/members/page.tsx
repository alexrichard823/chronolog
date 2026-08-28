import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createClient } from "@/lib/supabase/server";
import { inviteFamilyMember, removeMember, revokeInvitation, updateMemberRole } from "./actions";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ invited?: string; revoked?: string; roleUpdated?: string; removed?: string; error?: string }>;
};

type MemberRow = { user_id: string; email: string; role: string; joined_at: string };
type InvitationRow = { invitation_id: string; invited_email: string; role: string; status: string; expires_at: string; created_at: string };
type ActivityRow = { action: string; actor_email: string | null; target_email: string | null; metadata: Record<string, string> | null; created_at: string };

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function activityText(item: ActivityRow) {
  const actor = item.actor_email ?? "A family member";
  if (item.action === "invitation_created") return `${actor} sent a ${item.metadata?.role ?? "member"} invitation.`;
  if (item.action === "invitation_revoked") return `${actor} revoked a pending invitation.`;
  if (item.action === "invitation_accepted") return `${item.target_email ?? actor} joined as ${item.metadata?.role ?? "a member"}.`;
  if (item.action === "member_role_changed") return `${actor} changed ${item.target_email ?? "a member"} from ${item.metadata?.from ?? "their old role"} to ${item.metadata?.to ?? "a new role"}.`;
  if (item.action === "member_removed") return `${actor} removed ${item.target_email ?? "a member"} from the family.`;
  return "Family membership changed.";
}

export default async function FamilyMembersPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const status = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/families/${familyId}/members`)}`);

  const [familyResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (familyResult.error || !familyResult.data) notFound();
  const currentRole = membershipResult.data?.role;
  if (!currentRole) redirect(`/families/${familyId}`);
  const isOwner = currentRole === "owner";

  const [membersResult, invitationsResult, activityResult] = await Promise.all([
    supabase.rpc("list_family_members", { target_family_id: familyId }),
    supabase.rpc("list_family_invitations", { target_family_id: familyId }),
    supabase.rpc("list_family_activity", { target_family_id: familyId }),
  ]);

  const members = (membersResult.data ?? []) as MemberRow[];
  const invitations = (invitationsResult.data ?? []) as InvitationRow[];
  const activity = (activityResult.data ?? []) as ActivityRow[];
  const loadError = membersResult.error || invitationsResult.error || activityResult.error;

  const errorMessages: Record<string, string> = {
    "invalid-email": "Enter a valid email address.",
    "invalid-role": "Choose Admin, Editor, or Viewer.",
    "already-member": "That email is already a member of this family.",
    "already-invited": "That email already has a pending invitation. Revoke it before sending another.",
    "rate-limited": "Too many invitations were sent recently. Try again later.",
    "email-send-failed": "The invitation record was created, but the email could not be sent. The pending invitation was revoked.",
    "invite-failed": "We could not create that invitation.",
    "revoke-failed": "We could not revoke that invitation.",
    "role-update-failed": "We could not change that member's role.",
    "remove-failed": "We could not remove that member.",
    "no-manage-access": "Only the Owner can manage family members.",
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
      <div className="mt-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Collaboration</p>
        <h1 className="mt-1 text-3xl font-semibold">Family Members</h1>
        <p className="mt-2 text-gray-600">Everyone in this archive can see current members and invitations. Only the Owner can manage access and roles.</p>
      </div>

      {status.invited === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Invitation sent. The link expires in 7 days.</p>}
      {status.revoked === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Invitation revoked.</p>}
      {status.roleUpdated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Member role updated.</p>}
      {status.removed === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Member removed. New family and private-media access is blocked immediately.</p>}
      {status.error && errorMessages[status.error] && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessages[status.error]}</p>}
      {loadError && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not load all collaboration details. Refresh and try again.</p>}

      {isOwner && (
        <section className="mt-8 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Invite a relative</h2>
          <p className="mt-2 text-sm text-gray-600">The invited address receives a secure sign-in link that returns to Chronolog to accept the family invitation.</p>
          <form action={inviteFamilyMember} className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
            <input type="hidden" name="familyId" value={familyId} />
            <div><label htmlFor="email" className="block text-sm font-medium">Email</label><input id="email" name="email" type="email" required maxLength={320} className="mt-2 w-full rounded border px-3 py-2" placeholder="relative@example.com" /></div>
            <div><label htmlFor="role" className="block text-sm font-medium">Role</label><select id="role" name="role" defaultValue="editor" className="mt-2 w-full rounded border px-3 py-2"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></div>
            <button type="submit" className="rounded bg-black px-4 py-2 text-white">Send invitation</button>
          </form>
          <p className="mt-4 text-xs text-gray-500">Admins can help manage archive settings and content. Editors can change family content. Viewers are read-only. Member access and roles remain Owner-controlled.</p>
        </section>
      )}

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Current members</h2>
        <div className="mt-5 space-y-4">
          {members.map((member) => {
            const isCurrentUser = member.user_id === user.id;
            return (
              <div key={member.user_id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{member.email}{isCurrentUser ? " (you)" : ""}</p><p className="mt-1 text-sm text-gray-500">{roleLabel(member.role)} · Joined {new Date(member.joined_at).toLocaleDateString()}</p></div>
                {member.role === "owner" ? (
                  <span className="text-sm font-medium text-gray-500">Owner</span>
                ) : isOwner ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <form action={updateMemberRole} className="flex items-center gap-2">
                      <input type="hidden" name="familyId" value={familyId} /><input type="hidden" name="userId" value={member.user_id} />
                      <select name="role" defaultValue={member.role} aria-label={`Role for ${member.email}`} className="rounded border px-3 py-2 text-sm"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
                      <button type="submit" className="rounded border px-3 py-2 text-sm">Update</button>
                    </form>
                    <ConfirmDeleteButton action={removeMember} fields={{ familyId, userId: member.user_id }} confirmMessage={`Remove ${member.email} from this family? Their new family and private-media access will stop immediately.`} label="Remove" />
                  </div>
                ) : isCurrentUser ? (
                  <ConfirmDeleteButton action={removeMember} fields={{ familyId, userId: member.user_id }} confirmMessage="Leave this family? You will immediately lose access." label="Leave family" />
                ) : (
                  <span className="text-sm text-gray-500">Managed by Owner</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Invitations</h2>
        {invitations.length ? <div className="mt-5 space-y-3">{invitations.map((invitation) => (
          <div key={invitation.invitation_id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">{invitation.invited_email}</p><p className="mt-1 text-sm text-gray-500">{roleLabel(invitation.role)} · {roleLabel(invitation.status)} · Expires {new Date(invitation.expires_at).toLocaleDateString()}</p></div>
            {isOwner && invitation.status === "pending" ? <ConfirmDeleteButton action={revokeInvitation} fields={{ familyId, invitationId: invitation.invitation_id }} confirmMessage={`Revoke the invitation for ${invitation.invited_email}?`} label="Revoke" /> : null}
          </div>
        ))}</div> : <p className="mt-4 text-gray-500">No invitations yet.</p>}
      </section>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Recent collaboration activity</h2>
        {activity.length ? <ul className="mt-5 space-y-3">{activity.map((item, index) => <li key={`${item.created_at}-${index}`} className="text-sm"><p>{activityText(item)}</p><p className="mt-1 text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p></li>)}</ul> : <p className="mt-4 text-gray-500">No collaboration activity yet.</p>}
      </section>
    </main>
  );
}
