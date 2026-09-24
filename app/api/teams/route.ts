import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { moderateText } from "../../../lib/groq";

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
  turnstileToken?: unknown;
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

function getPublicReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase server secret não está configurado.");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isOwnedPublicAsset(value: string, bucket: string, userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !value) return false;

  try {
    const url = new URL(value);
    const base = new URL(baseUrl);
    return url.origin === base.origin
      && url.pathname.startsWith(`/storage/v1/object/public/${bucket}/${userId}/`);
  } catch {
    return false;
  }
}

type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "missing_token" | "verification_failed"; errorCodes?: string[] };

async function verifyTurnstile(token: string, request: NextRequest, requestId: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[teams:create] turnstile secret missing", { requestId });
    return { ok: false, reason: "missing_secret" };
  }
  if (!token) return { ok: false, reason: "missing_token" };

  const formData = new URLSearchParams({ secret, response: token });
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) formData.set("remoteip", forwardedFor.split(",")[0].trim());

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const result = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
      hostname?: string;
    };

    if (response.ok && result.success === true) {
      return { ok: true };
    }

    console.warn("[teams:create] turnstile verification failed", {
      requestId,
      errorCodes: result["error-codes"],
      hostname: result.hostname,
    });
    return { ok: false, reason: "verification_failed", errorCodes: result["error-codes"] };
  } catch (error) {
    console.error("[teams:create] turnstile request failed", { requestId, error });
    return { ok: false, reason: "verification_failed" };
  }
}

export async function GET(request: NextRequest) {
  const { requestId } = getRequestContext(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return responseError(503, "DATABASE_UNAVAILABLE", "A listagem de times está temporariamente indisponível.", requestId);

  const supabase = getPublicReadClient();
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
    canRequestMatch: Boolean(team.whatsapp_number),
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
  const associationType = input.associationType === "Escola"
    ? "SCHOOL"
    : input.associationType === "Bairro"
      ? "NEIGHBORHOOD"
      : "";
  const modality = text(input.fieldType);

  if (name.length < 3 || name.length > 80) return responseError(422, "INVALID_NAME", "O nome deve ter entre 3 e 80 caracteres.", requestId);
  if (origin.length < 2 || origin.length > 100) return responseError(422, "INVALID_ORIGIN", "Indica um bairro ou escola válido.", requestId);
  if (location.length < 2 || location.length > 120) return responseError(422, "INVALID_LOCATION", "Indica o campo habitual.", requestId);
  if (whatsapp.replace(/\D/g, "").length < 9) return responseError(422, "INVALID_CONTACT", "Indica um WhatsApp válido com código do país.", requestId);
  if (!["Futsal", "Futebol 11", "Society"].includes(modality)) return responseError(422, "INVALID_MODALITY", "Seleciona um tipo de jogo válido.", requestId);
  if (!associationType) return responseError(422, "INVALID_ASSOCIATION", "Seleciona uma associação válida.", requestId);
  if (description.length > 500) return responseError(422, "INVALID_DESCRIPTION", "A descrição deve ter no máximo 500 caracteres.", requestId);

  try {
    const supabase = getClient(accessToken);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return responseError(401, "INVALID_SESSION", "A sessão expirou. Entra novamente.", requestId);

    const turnstileToken = text(input.turnstileToken);
    const turnstile = await verifyTurnstile(turnstileToken, request, requestId);
    if (!turnstile.ok) {
      if (turnstile.reason === "missing_secret") {
        return responseError(503, "TURNSTILE_UNAVAILABLE", "A proteção anti-spam não está configurada no servidor.", requestId);
      }
      const isDuplicate = turnstile.errorCodes?.includes("timeout-or-duplicate");
      return responseError(
        403,
        "TURNSTILE_FAILED",
        isDuplicate
          ? "A confirmação expirou ou já foi usada. Confirma novamente a proteção anti-spam."
          : "Confirma a proteção anti-spam e tenta novamente.",
        requestId,
      );
    }

    const moderation = await moderateText(`NOME: ${name}\nDESCRIÇÃO: ${description}`);
    if (moderation.flagged) {
      return responseError(422, "CONTENT_REJECTED", moderation.reason || "Revê o nome ou a descrição do teu time.", requestId);
    }

    if (input.logoUrl && !isOwnedPublicAsset(text(input.logoUrl), "logosdostimes", authData.user.id)) {
      return responseError(422, "INVALID_LOGO", "A logo enviada não é válida.", requestId);
    }

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
