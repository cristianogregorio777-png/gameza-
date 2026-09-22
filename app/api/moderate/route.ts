import { NextRequest, NextResponse } from "next/server";
import { moderateText } from "../../../lib/groq";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  let body: { textToModerate?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { flagged: true, reason: "Requisição inválida." },
      { status: 400 }
    );
  }

  const textToModerate =
    body && typeof body.textToModerate === "string" ? body.textToModerate.trim() : "";

  if (!textToModerate || textToModerate.length > 5000) {
    return NextResponse.json(
      { flagged: true, reason: "O texto deve ter entre 1 e 5000 caracteres." },
      { status: 400 }
    );
  }

  try {
    const result = await moderateText(textToModerate);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[moderate] erro ao chamar Groq:", err);
    // Falha da IA não deve travar o usuário indefinidamente, mas também
    // não deve aprovar às cegas — devolvemos 503 e o client trata o retry.
    return NextResponse.json(
      {
        flagged: true,
        reason: "Moderação indisponível no momento. Tenta novamente em instantes.",
      },
      { status: 503 }
    );
  }
}
