import { Compass, Shield, UserRound, type LucideIcon } from "lucide-react";

export type SessionState = "loading" | "anonymous" | "authenticated";
export type NavigationId = "explore" | "club" | "profile";

export interface NavigationContext {
  session: SessionState;
  hasClub: boolean;
}

export interface NavigationItem {
  id: NavigationId;
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getNavigationItems({ session, hasClub }: NavigationContext): NavigationItem[] {
  const items: NavigationItem[] = [
    { id: "explore", label: "Explorar", href: "/", icon: Compass },
  ];

  if (session === "authenticated") {
    items.push({
      id: "club",
      label: hasClub ? "Meu clube" : "Criar clube",
      href: hasClub ? "/clube" : "/clube/novo",
      icon: Shield,
    });
  }

  items.push({
    id: "profile",
    label: "Perfil",
    href: session === "authenticated" ? "/perfil" : "/entrar?returnTo=/perfil",
    icon: UserRound,
  });

  return items;
}
