import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserContext } from "../../../../lib/contracts/user-context";

export const runtime = "nodejs";

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!accessToken) {
    return errorResponse(401, "AUTH_REQUIRED", "Inicia sessão para continuar.", requestId);
  }

  if (!url || !anonKey) {
    return errorResponse(503, "AUTH_UNAVAILABLE", "Autenticação indisponível.", requestId);
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return errorResponse(401, "INVALID_SESSION", "A sessão expirou. Entra novamente.", requestId);
  }

  const user = authData.user;
  const [{ data: profile, error: profileError }, { data: clubs, error: clubsError }] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, onboarding_completed, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, logo_url, owner_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (profileError || clubsError) {
    console.error("[user/context] query failed", { requestId, profileError, clubsError });
    return errorResponse(500, "CONTEXT_UNAVAILABLE", "Não foi possível carregar o teu contexto.", requestId);
  }

  const ownedClubs = (clubs || []).map((club) => ({
    id: club.id,
    name: club.name,
    logoUrl: club.logo_url,
    role: "owner" as const,
    status: "active" as const,
  }));
  const onboarding = profile?.onboarding_completed ? "complete" : "not_started";
  const context: UserContext = {
    user: {
      id: user.id,
      email: user.email || profile?.email || "",
      displayName: (user.user_metadata?.full_name as string | undefined) || null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
      emailVerified: Boolean(user.email_confirmed_at),
    },
    account: {
      status: "active",
      onboarding,
      createdAt: profile?.created_at || user.created_at,
    },
    capabilities: {
      canCreateClub: true,
      canEditClub: ownedClubs.length > 0,
      canRequestMatch: true,
      canModerate: false,
      canManageSettings: true,
    },
    navigation: [
      { id: "explore", href: "/", label: "Explorar" },
      ...(ownedClubs.length > 0
        ? [{ id: "club" as const, href: `/clube/${ownedClubs[0].id}`, label: "Meu clube" }]
        : [{ id: "club" as const, href: "/clube/novo", label: "Criar clube" }]),
      { id: "profile", href: "/perfil", label: "Perfil" },
    ],
    clubs: ownedClubs,
    meta: { contextVersion: 1, generatedAt: new Date().toISOString(), requestId },
  };

  return NextResponse.json(context, {
    headers: { "Cache-Control": "private, max-age=30", "X-Request-Id": requestId },
  });
}
