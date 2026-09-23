"use client";

import { ArrowRight, LogOut, Shield, UserRound } from "lucide-react";

interface ProfileDashboardProps {
  email?: string;
  hasClub: boolean;
  onCreateClub: () => void;
  onSignOut: () => void;
}

export default function ProfileDashboard({ email, hasClub, onCreateClub, onSignOut }: ProfileDashboardProps) {
  return (
    <section className="min-h-screen px-4 pb-28 pt-6 lg:flex lg:min-h-[calc(100vh-2rem)] lg:items-center lg:justify-center">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange text-cream">
            <UserRound size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Perfil</p>
            <h1 className="mt-1 text-xl font-semibold text-ink">A tua conta</h1>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">Email</p>
          <p className="mt-2 break-all text-sm text-ink">{email || "Conta Raios"}</p>
        </div>

        <div className="mt-3 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive text-cream">
              <Shield size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{hasClub ? "O teu clube" : "Ainda não tens um clube"}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-mute">
                {hasClub ? "Acede ao dashboard para gerir identidade e jogos." : "Cria um clube quando estiveres pronto para marcar jogos."}
              </p>
            </div>
          </div>
          {!hasClub && (
            <button onClick={onCreateClub} className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-orange py-3 text-sm font-bold text-cream">
              Criar clube
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <button onClick={onSignOut} className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink-mute hover:text-ink">
          <LogOut size={16} />
          Terminar sessão
        </button>
      </div>
    </section>
  );
}
