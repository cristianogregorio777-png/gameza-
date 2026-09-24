"use client";

import { useCallback, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, ShieldCheck } from "lucide-react";

const SITE_KEY = ""; // process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type GateState = "loading" | "verified" | "challenge" | "error";

export default function HumanVerificationGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>(SITE_KEY ? "loading" : "verified");
  const [errorMessage, setErrorMessage] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);

  const checkSession = useCallback(async () => {
    if (!SITE_KEY) {
      setState("verified");
      return;
    }
    try {
      const response = await fetch("/api/turnstile", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as { verified?: boolean };
      setState(data.verified ? "verified" : "challenge");
    } catch {
      setState("challenge");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const onTurnstileSuccess = async (token: string) => {
    setErrorMessage("");
    try {
      const response = await fetch("/api/turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as { success?: boolean; reason?: string };
      if (response.ok && data.success) {
        setState("verified");
        return;
      }
      setErrorMessage(data.reason || "Não foi possível confirmar. Tenta outra vez.");
      setState("error");
      setWidgetKey((k) => k + 1);
    } catch {
      setErrorMessage("Erro de ligação. Verifica a internet e tenta novamente.");
      setState("error");
      setWidgetKey((k) => k + 1);
    }
  };

  if (state === "verified") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base/95 px-6 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-card border border-cream/15 bg-navy-soft p-6 text-center shadow-xl">
          {state === "loading" ? (
            <>
              <Loader2 className="mx-auto animate-spin text-gold" size={32} />
              <p className="font-body mt-4 text-sm text-ink-mute">A preparar os Raios…</p>
            </>
          ) : (
            <>
              <ShieldCheck className="mx-auto text-gold" size={36} />
              <h1 className="font-display mt-4 text-xl text-ink">Confirma que és humano</h1>
              <p className="font-body mt-2 text-sm text-ink-mute">
                Proteção rápida contra spam. Só precisas fazer isto uma vez por sessão.
              </p>
              {errorMessage && (
                <p className="font-body mt-3 text-sm text-red-400" role="alert">
                  {errorMessage}
                </p>
              )}
              <div className="mt-5 flex justify-center">
                <Turnstile
                  key={widgetKey}
                  siteKey={SITE_KEY}
                  onSuccess={onTurnstileSuccess}
                  onExpire={() => {
                    setErrorMessage("A confirmação expirou. Completa outra vez.");
                    setWidgetKey((k) => k + 1);
                  }}
                  onError={() => {
                    setErrorMessage("Não foi possível carregar a verificação. Tenta outra vez.");
                    setState("error");
                    setWidgetKey((k) => k + 1);
                  }}
                  options={{ theme: "dark", size: "normal", refreshExpired: "auto" }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="pointer-events-none select-none opacity-20" aria-hidden>
        {children}
      </div>
    </>
  );
}
