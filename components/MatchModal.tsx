"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Team } from "../lib/types";

interface MatchModalProps {
  team: Team | null;
  onClose: () => void;
}

function buildWhatsAppLink(team: Team, date: string, time: string, local: string) {
  const message =
    `Olá ${team.captainName}! 👋 Sou da Gameza e gostava de marcar um jogo ` +
    `contra o ${team.name}.\n\n` +
    `📅 Data: ${date}\n` +
    `⏰ Hora: ${time}\n` +
    `📍 Local sugerido: ${local}\n\n` +
    `Ficas a jeito?`;

  const phone = team.captainWhatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function MatchModal({ team, onClose }: MatchModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [local, setLocal] = useState("");

  const isValid = date && time && local.trim().length > 2;

  const handleSubmit = () => {
    if (!team || !isValid) return;
    const link = buildWhatsAppLink(team, date, time, local.trim());
    window.open(link, "_blank", "noopener,noreferrer");
    onClose();
    setDate("");
    setTime("");
    setLocal("");
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
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
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-app rounded-t-sheet border-t border-line bg-surface px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto h-1 w-10 rounded-pill bg-white/15" />

            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="font-body text-xs text-ink-mute">Marcar jogo contra</p>
                <h2 className="font-display text-2xl text-ink">{team.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-line p-2 text-ink-mute hover:text-ink"
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
              disabled={!isValid}
              className="font-body mt-6 w-full rounded-pill bg-lime py-3.5 text-sm font-semibold text-base transition-opacity disabled:opacity-30"
            >
              Enviar para o capitão no WhatsApp
            </button>
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
