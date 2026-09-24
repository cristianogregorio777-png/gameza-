"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { AssociationType, FieldType, NewTeamDraft } from "../lib/types";
import { useToast } from "./Toast";
import { uploadTeamLogo } from "../lib/supabase-browser";
import { Turnstile } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const STEPS = ["Identidade", "Associação", "Contacto", "Revisão"] as const;
type StepId = (typeof STEPS)[number];

const EMPTY_DRAFT: NewTeamDraft = {
  name: "",
  logoFile: null,
  logoPreview: null,
  associationType: "Bairro",
  origin: "",
  location: "",
  fieldType: "Futebol 11",
  whatsapp: "",
  description: "",
};

async function createTeam(draft: NewTeamDraft, turnstileToken: string) {
  const supabase = (await import("../lib/supabase-browser")).getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) throw new Error("Inicia sessão antes de publicar o clube.");
  const accessToken = session.access_token;

  const logoUrl = draft.logoFile
    ? await uploadTeamLogo(draft.logoFile, session.user.id)
    : "";

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ ...draft, logoUrl, turnstileToken }),
      credentials: "same-origin",
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    console.info("[teams:create] persistence response", { status: response.status, body: data });
    if (!response.ok) {
      const error = new Error(data.error?.message || "O servidor não conseguiu publicar o clube.") as Error & {
        code?: string;
      };
      error.code = data.error?.code;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("[teams:create] persistence request failure", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("O servidor demorou demasiado. Verifica a ligação e tenta novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function CreateTeamFlow({ onCreated }: { onCreated?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<NewTeamDraft>(EMPTY_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const { showToast } = useToast();

  const step = STEPS[stepIndex];

  const update = <K extends keyof NewTeamDraft>(key: K, value: NewTeamDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (!canAdvance(step, draft)) return;
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitFailed(false);
    try {
      await createTeam(draft, turnstileToken);

      setIsDone(true);
      showToast("success", "Time criado!", `${draft.name} já está visível nos Raios.`);
    } catch (error) {
      setSubmitFailed(true);
      setWidgetKey(k => k + 1);
      setTurnstileToken("");
      showToast(
        "error",
        "Publicação falhou",
        error instanceof Error ? error.message : "Não conseguimos publicar o clube. Tenta novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 size={48} className="text-gold" />
        <h2 className="font-display mt-4 text-3xl text-ink">Time criado</h2>
        <p className="font-body mt-2 max-w-xs text-sm text-ink-mute">
          {draft.name} já pode ser encontrado por outros times na aba Explorar.
        </p>
        <button
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setStepIndex(0);
            setIsDone(false);
          }}
          className="font-body mt-8 rounded-pill bg-orange px-6 py-3 text-sm font-bold text-cream"
        >
          Criar outro time
        </button>
        {onCreated && (
          <button
            onClick={onCreated}
            className="font-body mt-3 rounded-pill border border-cream/20 bg-navy-soft px-6 py-3 text-sm font-semibold text-cream"
          >
            Ver times publicados
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="texture-noise min-h-screen px-5 pb-32 pt-6">
      <StepHeader stepIndex={stepIndex} />

      <div className="relative mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
          >
            {step === "Identidade" && <StepIdentidade draft={draft} update={update} />}
            {step === "Associação" && <StepAssociacao draft={draft} update={update} />}
            {step === "Contacto" && <StepContacto draft={draft} update={update} />}
            {step === "Revisão" && (
              <div className="space-y-6">
                <StepRevisao draft={draft} />
                {SITE_KEY && (
                  <div className="flex flex-col items-center justify-center pt-2">
                    <Turnstile
                      key={widgetKey}
                      siteKey={SITE_KEY}
                      onSuccess={setTurnstileToken}
                      onError={() => {
                        setTurnstileToken("");
                        setWidgetKey(k => k + 1);
                      }}
                      onExpire={() => {
                        setTurnstileToken("");
                        setWidgetKey(k => k + 1);
                      }}
                      options={{ theme: "dark", action: "create_team" }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-24 mx-auto flex max-w-app gap-3 px-5">
        {stepIndex > 0 && (
          <button
            onClick={goBack}
            className="flex items-center justify-center rounded-pill border border-line bg-surface px-4 py-3.5 text-ink-mute"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {step !== "Revisão" ? (
          <button
            onClick={goNext}
            disabled={!canAdvance(step, draft)}
            className="font-body flex flex-1 items-center justify-center gap-2 rounded-pill bg-orange py-3.5 text-sm font-bold text-cream disabled:opacity-30"
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting || (SITE_KEY ? !turnstileToken : false)}
            className="font-body flex flex-1 items-center justify-center gap-2 rounded-pill bg-orange py-3.5 text-sm font-bold text-cream disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A validar conteúdo…
              </>
            ) : (
              submitFailed ? "Tentar publicar novamente" : "Criar time"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- validação por etapa ---------- */

function canAdvance(step: StepId, draft: NewTeamDraft) {
  switch (step) {
    case "Identidade":
      return draft.name.trim().length >= 3;
    case "Associação":
      return draft.origin.trim().length >= 2 && draft.location.trim().length >= 2;
    case "Contacto":
      return draft.whatsapp.replace(/\D/g, "").length >= 9;
    default:
      return true;
  }
}

/* ---------- header de progresso ---------- */

function StepHeader({ stepIndex }: { stepIndex: number }) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-ink-mute">
        Passo {stepIndex + 1} de {STEPS.length}
      </p>
      <h1 className="font-display mt-1 text-3xl text-ink">{STEPS[stepIndex]}</h1>

      <div className="mt-4 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={[
              "h-1 flex-1 rounded-pill transition-colors",
              i <= stepIndex ? "bg-orange" : "bg-cream/15",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- etapas ---------- */

function StepIdentidade({
  draft,
  update,
}: {
  draft: NewTeamDraft;
  update: <K extends keyof NewTeamDraft>(key: K, value: NewTeamDraft[K]) => void;
}) {
  const onLogoChange = (file: File | null) => {
    if (draft.logoPreview) URL.revokeObjectURL(draft.logoPreview);
    if (file && (!new Set(["image/png", "image/jpeg", "image/webp"]).has(file.type) || file.size > 2 * 1024 * 1024)) {
      update("logoFile", null);
      update("logoPreview", null);
      return;
    }
    update("logoFile", file);
    update("logoPreview", file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="space-y-5">
      <label className="mx-auto flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-full border border-dashed border-cream/25 bg-navy-soft">
        {draft.logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.logoPreview}
            alt="Logo do time"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <>
            <Camera size={22} className="text-ink-mute" />
            <span className="font-body text-[11px] text-ink-mute">Logo do time</span>
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
        />
      </label>

      <Field label="Nome do time">
        <input
          value={draft.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={80}
          placeholder="Ex: Leões do Camama"
          className="field-input"
        />
      </Field>
    </div>
  );
}

function StepAssociacao({
  draft,
  update,
}: {
  draft: NewTeamDraft;
  update: <K extends keyof NewTeamDraft>(key: K, value: NewTeamDraft[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Associação">
        <div className="flex gap-2">
          {(["Bairro", "Escola"] as AssociationType[]).map((opt) => (
            <button
              key={opt}
              onClick={() => update("associationType", opt)}
              className={[
                "flex-1 rounded-card border py-3 text-sm font-medium transition-colors",
                draft.associationType === opt
                  ? "border-orange bg-orange/15 text-orange"
                  : "border-cream/15 text-ink-mute",
              ].join(" ")}
            >
              {opt}
            </button>
          ))}
        </div>
      </Field>

      <Field label={draft.associationType === "Escola" ? "Nome da escola" : "Nome do bairro"}>
        <input
          value={draft.origin}
          onChange={(e) => update("origin", e.target.value)}
          maxLength={100}
          placeholder="Ex: Camama"
          className="field-input"
        />
      </Field>

      <Field label="Campo habitual">
        <input
          value={draft.location}
          onChange={(e) => update("location", e.target.value)}
          maxLength={120}
          placeholder="Ex: Campo da Rotunda"
          className="field-input"
        />
      </Field>

      <Field label="Tipo de jogo">
        <div className="flex flex-wrap gap-2">
          {(["Futsal", "Futebol 11", "Society"] as FieldType[]).map((opt) => (
            <button
              key={opt}
              onClick={() => update("fieldType", opt)}
              className={[
                "rounded-pill border px-4 py-2 text-[13px] font-medium transition-colors",
                draft.fieldType === opt
                  ? "border-olive bg-olive text-cream"
                  : "border-cream/15 text-ink-mute",
              ].join(" ")}
            >
              {opt}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepContacto({
  draft,
  update,
}: {
  draft: NewTeamDraft;
  update: <K extends keyof NewTeamDraft>(key: K, value: NewTeamDraft[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="WhatsApp de contacto (com código do país)">
        <input
          value={draft.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          maxLength={30}
          placeholder="244 923 000 000"
          inputMode="tel"
          className="field-input"
        />
      </Field>

      <Field label="Breve descrição">
        <textarea
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={500}
          placeholder="Conta um pouco sobre o time: quando jogam, o nível, o espírito..."
          rows={4}
          className="field-input resize-none"
        />
      </Field>
    </div>
  );
}

function StepRevisao({ draft }: { draft: NewTeamDraft }) {
  const rows: [string, string][] = [
    ["Nome", draft.name],
    ["Associação", `${draft.associationType} — ${draft.origin}`],
    ["Campo habitual", draft.location],
    ["Tipo de jogo", draft.fieldType],
    ["WhatsApp", draft.whatsapp],
  ];

  return (
    <div className="rounded-card border border-cream/15 bg-navy-soft p-4">
      <p className="font-body mb-3 text-xs text-ink-mute">
        Confirma os dados antes de enviar. O nome e a descrição passam por uma
        validação automática antes do time ficar visível.
      </p>
      <div className="divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5">
            <span className="font-body text-sm text-ink-mute">{label}</span>
            <span className="font-body max-w-[60%] truncate text-right text-sm text-ink">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
      {draft.description && (
        <p className="font-body mt-3 text-sm text-ink-mute">{draft.description}</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-body mb-1.5 block text-xs font-medium text-ink-mute">
        {label}
      </span>
      {children}
    </label>
  );
}
