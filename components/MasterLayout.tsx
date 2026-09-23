"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { getNavigationItems, type NavigationContext, type NavigationId } from "./navigation-model";

interface MasterLayoutProps extends NavigationContext {
  active: NavigationId;
  children: React.ReactNode;
}

export default function MasterLayout({ session, hasClub, active, children }: MasterLayoutProps) {
  const items = getNavigationItems({ session, hasClub });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface/70 px-5 py-6 lg:flex lg:flex-col">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          RAIOS<span className="text-orange">.</span>
        </Link>

        <nav className="mt-12 space-y-1" aria-label="Navegação principal">
          {items.map(({ id, label, href, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                active === id ? "bg-orange text-cream" : "text-ink-mute hover:bg-cream/5 hover:text-cream",
              ].join(" ")}
            >
              <Icon size={18} strokeWidth={active === id ? 2.5 : 2} />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/definicoes"
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-ink-mute hover:bg-cream/5 hover:text-cream"
        >
          <Settings size={18} />
          Definições
        </Link>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-4 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mute">Raios</p>
          <Link href="/perfil" className="text-sm font-semibold text-ink hover:text-orange">
            Conta
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-10 lg:py-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base/95 px-3 py-2 backdrop-blur-glass lg:hidden" aria-label="Navegação móvel">
        <div className="mx-auto flex max-w-app items-center justify-around">
          {items.map(({ id, label, href, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={[
                "flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold",
                active === id ? "text-orange" : "text-ink-mute",
              ].join(" ")}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
