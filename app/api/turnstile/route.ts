import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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

  if (!token || !secret) {
    return NextResponse.json(
      { success: false, reason: "Proteção anti-spam indisponível." },
      { status: 503 }
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, reason: "Não foi possível validar a proteção anti-spam." },
      { status: 502 }
    );
  }
}
