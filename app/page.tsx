"use client";

import { useEffect, useState } from "react";
import BottomNav, { Tab } from "../components/BottomNav";
import ExploreScreen from "../components/ExploreScreen";
import CreateTeamFlow from "../components/CreateTeamFlow";
import AuthPanel from "../components/AuthPanel";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReturnTab, setAuthReturnTab] = useState<Tab>("profile");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");

    try {
      const supabase = getSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data.session));
        if (requestedTab === "create" || requestedTab === "profile") {
          setAuthReturnTab(requestedTab);
          setTab(data.session ? requestedTab : "profile");
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

    setAuthReturnTab(nextTab);
    setTab("profile");
  };

  return (
    <>
      {tab === "explore" && <ExploreScreen />}
      {tab === "create" && <CreateTeamFlow />}
      {tab === "profile" && (
        <AuthPanel
          onBack={() => setTab("explore")}
          onAuthenticated={() => setTab(authReturnTab)}
        />
      )}

      <BottomNav active={tab} onChange={handleTabChange} />
    </>
  );
}
