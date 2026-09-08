import PasswordRecoveryForm from "@/components/password-recovery-form";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <PasswordRecoveryForm invalid={error === "invalid-link"} />;
}
