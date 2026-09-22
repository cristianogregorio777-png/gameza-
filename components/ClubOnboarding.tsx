"use client";

import { ArrowRight, Check, Plus, Sparkles, Users } from "lucide-react";

interface ClubOnboardingProps {
  onBack: () => void;
  onCustomize: () => void;
  onSkip: () => void;
}

export default function ClubOnboarding({ onBack, onCustomize, onSkip }: ClubOnboardingProps) {
  return (
    <section className="min-h-screen px-4 pb-28 pt-6 lg:flex lg:min-h-[calc(100vh-2rem)] lg:items-center lg:justify-center">
      <div className="w-full max-w-[480px] rounded-[30px] border border-line bg-white/[0.02] p-5 lg:p-8">
        <button onClick={onBack} className="text-sm font-medium text-ink-mute transition-colors hover:text-ink">
          Voltar
        </button>

        <div className="mt-6 rounded-[22px] border border-line bg-[radial-gradient(circle_at_top_left,rgba(182,255,60,0.12),transparent_35%),rgba(255,255,255,0.02)] p-4">
          <div className="mb-4 inline-flex rounded-full border border-lime/30 bg-lime/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-lime">
            Clube
          </div>
          <h1 className="font-display text-3xl leading-none text-ink">O teu clube começa aqui.</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Personaliza o teu time ou salta directamente para o próximo passo.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <FeatureRow icon={<Users size={17} />} title="Seleciona o teu time" description="Define a identidade e a zona do teu clube." />
          <FeatureRow icon={<Sparkles size={17} />} title="Personaliza o visual" description="Logo, descrição e detalhes visuais." />
          <FeatureRow icon={<Check size={17} />} title="Acede ao teu perfil" description="Mantém tudo organizado e pronto para marcar jogos." />
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onCustomize}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-3.5 text-sm font-bold text-base"
          >
            Personalizar clube
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onSkip}
            className="flex w-full items-center justify-center gap-2 rounded-pill border border-line bg-white/[0.02] py-3.5 text-sm font-semibold text-ink"
          >
            <Plus size={16} />
            Pular por agora
          </button>
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-[#111111]/80 p-3.5">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-lime/10 text-lime">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-mute">{description}</p>
      </div>
    </div>
  );
}
