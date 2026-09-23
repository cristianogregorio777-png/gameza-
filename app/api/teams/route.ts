import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

interface TeamInput {
  name?: unknown;
  associationType?: unknown;
  origin?: unknown;
  location?: unknown;
  fieldType?: unknown;
  whatsapp?: unknown;
  description?: unknown;
  logoUrl?: unknown;
}

function responseError(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

function getRequestContext(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  return { requestId, accessToken };
}

function getClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase público não está configurado.");

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function GET(request: NextRequest) {
  const { requestId } = getRequestContext(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return responseError(503, "DATABASE_UNAVAILABLE", "A base de dados não está configurada.", requestId);

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, logo_url, association_type, origin, modality, home_field, whatsapp_number, description")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[teams:list] database failure", { requestId, status: error.code, body: error.message, stack: error.details });
    return responseError(500, "TEAMS_READ_FAILED", "Não foi possível carregar os times. Tenta novamente.", requestId);
  }

  return NextResponse.json({ items: (data || []).map((team) => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logo_url || "",
    origin: team.origin || "Angola",
    associationType: team.association_type === "SCHOOL" ? "Escola" : "Bairro",
    fieldType: team.modality,
    playersCount: 0,
    captainName: "Capitão do time",
    captainWhatsapp: team.whatsapp_number || "",
    description: team.description || "",
    size: "sm",
  })) }, { headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const { requestId, accessToken } = getRequestContext(request);
  console.info("[teams:create] submit", { requestId, hasAccessToken: Boolean(accessToken) });

  if (!accessToken) return responseError(401, "AUTH_REQUIRED", "Inicia sessão antes de publicar um clube.", requestId);

  let input: TeamInput;
  try {
    input = (await request.json()) as TeamInput;
    console.info("[teams:create] payload", { requestId, keys: Object.keys(input) });
  } catch (error) {
    console.error("[teams:create] invalid JSON", { requestId, error });
    return responseError(400, "INVALID_JSON", "Os dados enviados não são válidos.", requestId);
  }

  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const name = text(input.name);
  const origin = text(input.origin);
  const location = text(input.location);
  const whatsapp = text(input.whatsapp);
  const description = text(input.description);
  const associationType = input.associationType === "Escola" ? "SCHOOL" : "NEIGHBORHOOD";
  const modality = text(input.fieldType);

  if (name.length < 3 || name.length > 80) return responseError(422, "INVALID_NAME", "O nome deve ter entre 3 e 80 caracteres.", requestId);
  if (origin.length < 2 || origin.length > 100) return responseError(422, "INVALID_ORIGIN", "Indica um bairro ou escola válido.", requestId);
  if (location.length < 2 || location.length > 120) return responseError(422, "INVALID_LOCATION", "Indica o campo habitual.", requestId);
  if (whatsapp.replace(/\D/g, "").length < 9) return responseError(422, "INVALID_CONTACT", "Indica um WhatsApp válido com código do país.", requestId);
  if (!modality) return responseError(422, "INVALID_MODALITY", "Seleciona o tipo de jogo.", requestId);
  if (description.length > 500) return responseError(422, "INVALID_DESCRIPTION", "A descrição deve ter no máximo 500 caracteres.", requestId);

  try {
    const supabase = getClient(accessToken);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return responseError(401, "INVALID_SESSION", "A sessão expirou. Entra novamente.", requestId);

    const { data, error } = await supabase.from("teams").insert({
      owner_id: authData.user.id,
      name,
      association_type: associationType,
      origin,
      modality,
      home_field: location,
      whatsapp_number: whatsapp,
      description: description || null,
      logo_url: text(input.logoUrl) || null,
    }).select("id, name, logo_url, association_type, origin, modality, home_field, whatsapp_number, description").single();

    console.info("[teams:create] database response", { requestId, status: error?.code || 201, body: error?.message || data?.id });
    if (error || !data) {
      console.error("[teams:create] persistence failure", { requestId, error, stack: error?.details });
      return responseError(500, "TEAM_CREATE_FAILED", "O clube não foi publicado. Tenta novamente.", requestId);
    }

    return NextResponse.json({ team: data }, { status: 201, headers: { "X-Request-Id": requestId } });
  } catch (error) {
    console.error("[teams:create] unexpected failure", { requestId, error, stack: error instanceof Error ? error.stack : undefined });
    return responseError(500, "TEAM_CREATE_FAILED", "O servidor não conseguiu publicar o clube.", requestId);
  }
}
