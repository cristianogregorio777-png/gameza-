import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase não está configurado no ambiente público.");
  }

  client ??= createClient(url, anonKey);
  return client;
}

export async function signInWithGoogle(nextTab: "create" | "profile") {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/?tab=${nextTab}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}