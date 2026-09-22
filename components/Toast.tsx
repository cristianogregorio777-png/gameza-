"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type ToastKind = "error" | "success";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, kind, title, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className={[
                "pointer-events-auto w-full max-w-sm rounded-card border px-4 py-3",
                "backdrop-blur-glass shadow-soft flex items-start gap-3",
                t.kind === "error"
                  ? "bg-red-500/10 border-red-500/25"
                  : "bg-lime/10 border-lime/25",
              ].join(" ")}
            >
              {t.kind === "error" ? (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-lime" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-ink">
                  {t.title}
                </p>
                {t.message && (
                  <p className="font-body text-sm text-ink-mute mt-0.5 leading-snug">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-ink-mute hover:text-ink transition-colors"
                aria-label="Fechar notificação"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
