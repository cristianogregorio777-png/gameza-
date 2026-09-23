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

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Email ou palavra-passe incorretos.");
  return data;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function uploadProfileAvatar(file: File, userId: string) {
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Escolhe uma imagem válida para o avatar.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("O avatar deve ter no máximo 2 MB.");
  }

  const supabase = getSupabaseBrowserClient();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Não foi possível carregar o avatar. Tenta novamente.");

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function uploadTeamLogo(file: File, userId: string) {
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Escolhe uma logo PNG, JPG ou WebP.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("A logo deve ter no máximo 2 MB.");
  }

  const supabase = getSupabaseBrowserClient();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("logosdostimes").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Não foi possível carregar a logo. Tenta novamente.");

  return supabase.storage.from("logosdostimes").getPublicUrl(path).data.publicUrl;
}