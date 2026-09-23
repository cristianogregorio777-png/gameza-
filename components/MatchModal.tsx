"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { Team } from "../lib/types";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

interface MatchModalProps {
  team: Team | null;
  onClose: () => void;
}

function buildMatchMessage(team: Team, date: string, time: string, local: string) {
  const message =
    `Olá ${team.captainName}! 👋 Sou dos Raios e gostava de marcar um jogo ` +
    `contra o ${team.name}.\n\n` +
    `📅 Data: ${date}\n` +
    `⏰ Hora: ${time}\n` +
    `📍 Local sugerido: ${local}\n\n` +
    `Ficas a jeito?`;

  return message;
}

export default function MatchModal({ team, onClose }: MatchModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [local, setLocal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isValid = date && time && local.trim().length > 2;

  const handleSubmit = async () => {
    if (!team || !isValid) return;
    setFeedback("");
    setIsSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Inicia sessão para enviar um pedido de jogo.");

      const response = await fetch(`/api/teams/${team.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ message: buildMatchMessage(team, date, time, local.trim()) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Não foi possível enviar o pedido.");

      window.open(payload.contactUrl, "_blank", "noopener,noreferrer");
      onClose();
      setDate("");
      setTime("");
      setLocal("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {team && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-navy-deep/80 backdrop-blur-sm"
          />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-dialog-title"
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-app rounded-t-sheet border-t border-cream/20 bg-navy-deep px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto h-1 w-10 rounded-pill bg-cream/25" />

            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="font-body text-xs text-ink-mute">Marcar jogo contra</p>
                <h2 id="match-dialog-title" className="font-display text-2xl text-ink">{team.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-cream/20 p-2 text-ink-mute hover:text-cream"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Data">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="field-input"
                />
              </Field>

              <Field label="Hora">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="field-input"
                />
              </Field>

              <Field label="Local sugerido">
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Campo do IMPTEL"
                  className="field-input"
                />
              </Field>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || isSending || !team.canRequestMatch}
              className="font-body mt-6 w-full rounded-pill bg-orange py-3.5 text-sm font-bold text-cream transition-opacity disabled:opacity-30"
            >
              {isSending ? <><Loader2 size={16} className="animate-spin" /> A preparar pedido…</> : team.canRequestMatch ? "Enviar pedido no WhatsApp" : "Contacto indisponível"}
            </button>
            {feedback && <p className="mt-3 text-center text-sm text-danger" role="alert">{feedback}</p>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
