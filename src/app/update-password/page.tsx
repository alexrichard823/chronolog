import { redirect } from "next/navigation";
import PasswordRecoveryForm from "@/components/password-recovery-form";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/forgot-password?error=invalid-link");
  return <PasswordRecoveryForm update />;
}
