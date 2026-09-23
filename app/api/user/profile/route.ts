import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getContext(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return { requestId, accessToken };
}

function fail(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

function isOwnedPublicAvatar(value: string, userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !value) return false;

  try {
    const url = new URL(value);
    const base = new URL(baseUrl);
    return url.origin === base.origin
      && url.pathname.startsWith(`/storage/v1/object/public/avatars/${userId}/`);
  } catch {
    return false;
  }
}

function client(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase público não está configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function authenticate(request: NextRequest) {
  const context = getContext(request);
  if (!context.accessToken) return { ...context, user: null };
  const supabase = client(context.accessToken);
  const { data } = await supabase.auth.getUser(context.accessToken);
  return { ...context, user: data.user || null, supabase };
}

export async function GET(request: NextRequest) {
  const context = await authenticate(request);
  if (!context.user) return fail(401, "AUTH_REQUIRED", "Inicia sessão para ver o perfil.", context.requestId);

  const { data, error } = await context.supabase!
    .from("users")
    .select("id, email, display_name, avatar_url, bio")
    .eq("id", context.user.id)
    .maybeSingle();

  if (error) {
    console.error("[user/profile] read failure", { requestId: context.requestId, error, stack: error.details });
    return fail(500, "PROFILE_READ_FAILED", "Não foi possível carregar o perfil.", context.requestId);
  }

  return NextResponse.json({
    profile: {
      id: context.user.id,
      email: data?.email || context.user.email || "",
      displayName: data?.display_name || (context.user.user_metadata?.full_name as string | undefined) || "",
      avatarUrl: data?.avatar_url || null,
      bio: data?.bio || "",
    },
  }, { headers: { "X-Request-Id": context.requestId, "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const context = await authenticate(request);
  if (!context.user) return fail(401, "AUTH_REQUIRED", "Inicia sessão para guardar o perfil.", context.requestId);

  let body: { displayName?: unknown; bio?: unknown; avatarUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "Os dados do perfil não são válidos.", context.requestId);
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : null;

  if (displayName.length < 2 || displayName.length > 80) return fail(422, "INVALID_DISPLAY_NAME", "O nome deve ter entre 2 e 80 caracteres.", context.requestId);
  if (bio.length > 240) return fail(422, "INVALID_BIO", "A bio deve ter no máximo 240 caracteres.", context.requestId);
  if (avatarUrl && (avatarUrl.length > 500 || !isOwnedPublicAvatar(avatarUrl, context.user.id))) {
    return fail(422, "INVALID_AVATAR", "A imagem do avatar não é válida.", context.requestId);
  }

  const { data, error } = await context.supabase!
    .from("users")
    .upsert({
      id: context.user.id,
      email: context.user.email || "",
      display_name: displayName,
      bio: bio || null,
      avatar_url: avatarUrl,
    }, { onConflict: "id" })
    .select("id, email, display_name, avatar_url, bio")
    .single();

  console.info("[user/profile] update response", { requestId: context.requestId, status: error?.code || 200, body: error?.message || data?.id });
  if (error || !data) {
    console.error("[user/profile] update failure", { requestId: context.requestId, error, stack: error?.details });
    return fail(500, "PROFILE_SAVE_FAILED", "Não foi possível guardar o perfil. Tenta novamente.", context.requestId);
  }

  return NextResponse.json({ profile: {
    id: data.id,
    email: data.email,
    displayName: data.display_name || "",
    avatarUrl: data.avatar_url || null,
    bio: data.bio || "",
  } }, { headers: { "X-Request-Id": context.requestId } });
}
