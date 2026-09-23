import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function fail(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

function getAccessToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function createAuthClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase público não está configurado.");

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase server secret não está configurado.");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const accessToken = getAccessToken(request);
  if (!accessToken) return fail(401, "AUTH_REQUIRED", "Inicia sessão para enviar um pedido de jogo.", requestId);

  const { teamId } = await params;
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message.trim() : "";
  } catch {
    return fail(400, "INVALID_JSON", "O pedido de jogo não é válido.", requestId);
  }

  if (!message || message.length > 1_000) {
    return fail(422, "INVALID_MESSAGE", "Escreve uma mensagem de até 1.000 caracteres.", requestId);
  }

  try {
    const auth = createAuthClient(accessToken);
    const { data: authData, error: authError } = await auth.auth.getUser(accessToken);
    if (authError || !authData.user) return fail(401, "INVALID_SESSION", "A sessão expirou. Entra novamente.", requestId);

    const service = createServiceClient();
    const { data: team, error } = await service
      .from("teams")
      .select("name, whatsapp_number")
      .eq("id", teamId)
      .maybeSingle();

    if (error) return fail(500, "CONTACT_UNAVAILABLE", "Não foi possível preparar o pedido de jogo.", requestId);
    if (!team?.whatsapp_number) return fail(404, "CONTACT_UNAVAILABLE", "Este time não recebe pedidos por WhatsApp.", requestId);

    const phone = team.whatsapp_number.replace(/\D/g, "");
    if (phone.length < 9) return fail(409, "CONTACT_INVALID", "Este time ainda não tem um contacto válido.", requestId);

    return NextResponse.json({ contactUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` }, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    });
  } catch {
    return fail(503, "CONTACT_UNAVAILABLE", "O pedido de jogo está temporariamente indisponível.", requestId);
  }
}
