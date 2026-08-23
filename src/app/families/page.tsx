import LogoutButton from "./logout-button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FamiliesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">Your Families</h1>
      <p className="mt-4">You are signed in as {user.email}</p>
      <LogoutButton />
    </main>
  );
}