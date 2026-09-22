import type { UserContext } from "./contracts/user-context";
import { getSupabaseBrowserClient } from "./supabase-browser";

export async function fetchUserContext(): Promise<UserContext> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("Sessão indisponível.");
  }

  const response = await fetch("/api/user/context", {
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as UserContext | { error?: { message?: string } };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error?.message || "Contexto indisponível." : "Contexto indisponível.");
  }

  return payload as UserContext;
}
