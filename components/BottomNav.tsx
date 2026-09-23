"use client";

import { Compass, ShieldPlus, User } from "lucide-react";

export type Tab = "explore" | "create" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "create", label: "Criar Time", icon: ShieldPlus },
  { id: "profile", label: "Perfil", icon: User },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label="Navegação principal"
    >
      <div className="flex w-full max-w-app items-center justify-between gap-1 rounded-card border border-cream/15 bg-navy-deep/95 px-2 py-2 backdrop-blur-glass shadow-soft">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={[
                "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors",
                isActive ? "text-cream" : "text-ink-mute hover:bg-cream/5 hover:text-cream",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute inset-0 -z-10 rounded-xl bg-orange"
                  style={{ transition: "all .25s ease" }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-body text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
