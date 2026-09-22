"use client";

import { useEffect, useState } from "react";
import BottomNav, { Tab } from "../components/BottomNav";
import ExploreScreen from "../components/ExploreScreen";
import CreateTeamFlow from "../components/CreateTeamFlow";
import { getSupabaseBrowserClient, signInWithGoogle } from "../lib/supabase-browser";
import { useToast } from "../components/Toast";

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");

    try {
      const supabase = getSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data.session));
        if (data.session && (requestedTab === "create" || requestedTab === "profile")) {
          setTab(requestedTab);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session));
      });

      return () => data.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  const handleTabChange = async (nextTab: Tab) => {
    if (nextTab === "explore" || isAuthenticated) {
      setTab(nextTab);
      return;
    }

    try {
      await signInWithGoogle(nextTab);
    } catch {
      showToast(
        "error",
        "Autenticação indisponível",
        "Configura o Google OAuth e as variáveis públicas do Supabase para continuar."
      );
    }
  };

  return (
    <>
      {tab === "explore" && <ExploreScreen />}
      {tab === "create" && <CreateTeamFlow />}
      {tab === "profile" && (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <p className="font-body text-sm text-ink-mute">
            Perfil — fora do escopo desta entrega.
          </p>
        </div>
      )}

      <BottomNav active={tab} onChange={handleTabChange} />
    </>
  );
}
