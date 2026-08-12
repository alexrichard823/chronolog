import { supabase } from "@/lib/supabase/client";

export default async function SupabaseTestPage() {
  const { error } = await supabase.auth.getSession();

  return (
    <main style={{ padding: "40px" }}>
      <h1>Supabase Connection Test</h1>

      {error ? (
        <p>Connection failed: {error.message}</p>
      ) : (
        <p>Supabase connection successful.</p>
      )}
    </main>
  );
}