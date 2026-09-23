"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Mail, UserRound } from "lucide-react";
import {
  getSupabaseBrowserClient,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../lib/supabase-browser";
import { useToast } from "./Toast";

interface AuthPanelProps {
  onBack: () => void;
  onAuthenticated: () => void;
}

export default function AuthPanel({ onBack, onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, name);

      if (mode === "signup" && !result.session) {
        showToast("success", "Conta criada", "Confirma o teu email para terminar o registo.");
        setMode("signin");
        return;
      }

      onAuthenticated();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Não foi possível autenticar.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle("profile");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Google OAuth indisponível.";
      setError(message);
    }
  };

  try {
    getSupabaseBrowserClient();
  } catch {
    return (
      <AuthShell onBack={onBack}>
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed text-cream">
          Configura `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente do Netlify para ativar as contas.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell onBack={onBack}>
      <div className="mb-5 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Conta</p>
        <h1 className="mt-3 font-display text-3xl leading-none text-ink">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-mute">
          Usa a tua conta Google ou email para gerir o teu clube.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-2xl border border-cream/15 bg-navy-deep p-1">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === value
                ? "bg-orange text-cream shadow-glow"
                : "text-ink-mute hover:text-cream"
            }`}
          >
            {value === "signin" ? "Entrar" : "Registar"}
          </button>
        ))}
      </div>

      <div className="rounded-[22px] border border-cream/15 bg-navy-soft p-4 shadow-soft">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Nome</span>
              <div className="flex items-center gap-3 rounded-xl border border-cream/15 bg-navy-deep px-3">
                <UserRound size={16} className="text-ink-mute" />
                <input value={name} onChange={(event) => setName(event.target.value)} className="field-input border-0 bg-transparent px-0 shadow-none" placeholder="O teu nome" required />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Email</span>
            <div className="flex items-center gap-3 rounded-xl border border-cream/15 bg-navy-deep px-3">
              <Mail size={16} className="text-ink-mute" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input border-0 bg-transparent px-0 shadow-none" placeholder="nome@email.com" required />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Palavra-passe</span>
            <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" placeholder="Mínimo de 6 caracteres" required />
          </label>

          {error && <p className="rounded-xl border border-danger/40 bg-danger/15 p-3 text-sm text-cream">{error}</p>}

          <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-pill bg-orange py-3.5 text-sm font-bold text-cream transition-opacity hover:opacity-95 disabled:opacity-60">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Entrar na conta" : "Criar conta"}
          </button>
        </form>
      </div>

      <div className="my-5 flex items-center gap-3 text-[11px] text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <button onClick={handleGoogle} className="w-full rounded-pill border border-cream/20 bg-navy-soft py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream/40">
        Continuar com Google
      </button>
    </AuthShell>
  );
}

function AuthShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <section className="min-h-screen px-4 pb-28 pt-6 lg:flex lg:min-h-[calc(100vh-2rem)] lg:items-center lg:justify-center">
      <div className="w-full max-w-[480px] lg:rounded-[30px] lg:border lg:border-cream/15 lg:bg-navy-deep lg:p-8 lg:shadow-soft">
        <button onClick={onBack} className="mb-7 flex items-center gap-2 text-sm font-semibold text-ink-mute transition-colors hover:text-ink">
          <ArrowLeft size={17} />
          Voltar
        </button>
        {children}
      </div>
    </section>
  );
}
