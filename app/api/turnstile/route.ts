import { NextRequest, NextResponse } from "next/server";
import {
  HUMAN_VERIFIED_COOKIE,
  HUMAN_VERIFIED_MAX_AGE_SEC,
  hasHumanVerifiedCookie,
} from "../../../lib/turnstile-session";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ verified: true, disabled: true });
  }

  const verified = hasHumanVerifiedCookie(req.cookies.get(HUMAN_VERIFIED_COOKIE)?.value);
  return NextResponse.json({ verified });
}

export async function POST(req: NextRequest) {
  let body: { token?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, reason: "Requisição inválida." },
      { status: 400 }
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    const response = NextResponse.json({ success: true, disabled: true });
    response.cookies.set(HUMAN_VERIFIED_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: HUMAN_VERIFIED_MAX_AGE_SEC,
      path: "/",
    });
    return response;
  }

  if (!token) {
    return NextResponse.json(
      { success: false, reason: "Proteção anti-spam indisponível." },
      { status: 400 }
    );
  }

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    formData.append("remoteip", forwardedFor.split(",")[0].trim());
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      }
    );
    const result = (await response.json()) as { success?: boolean };

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { success: false, reason: "Confirma a proteção anti-spam e tenta novamente." },
        { status: 403 }
      );
    }

    const json = NextResponse.json({ success: true });
    json.cookies.set(HUMAN_VERIFIED_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: HUMAN_VERIFIED_MAX_AGE_SEC,
      path: "/",
    });
    return json;
  } catch {
    return NextResponse.json(
      { success: false, reason: "Não foi possível validar a proteção anti-spam." },
      { status: 502 }
    );
  }
}
