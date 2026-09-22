"use client";

import { useEffect, useState } from "react";
import BottomNav, { Tab } from "../components/BottomNav";
import ExploreScreen from "../components/ExploreScreen";
import CreateTeamFlow from "../components/CreateTeamFlow";
import AuthPanel from "../components/AuthPanel";
import ClubOnboarding from "../components/ClubOnboarding";
import ProfileDashboard from "../components/ProfileDashboard";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { fetchUserContext } from "../lib/user-context";
import type { UserContext } from "../lib/contracts/user-context";

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReturnTab, setAuthReturnTab] = useState<Tab>("create");
  const [showClubOnboarding, setShowClubOnboarding] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");

    try {
      const supabase = getSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        const sessionExists = Boolean(data.session);
        setIsAuthenticated(sessionExists);

        if (sessionExists) {
          void fetchUserContext()
            .then((context) => {
              setUserContext(context);
              setShowClubOnboarding(context.account.onboarding !== "complete");
            })
            .catch(() => setUserContext(null));
        }

        if (requestedTab === "create" || requestedTab === "profile") {
          setAuthReturnTab(requestedTab);
          setTab(sessionExists ? requestedTab : "profile");
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionExists = Boolean(session);
        setIsAuthenticated(sessionExists);
        if (!sessionExists) {
          setUserContext(null);
          setShowClubOnboarding(false);
        }
      });

      return () => data.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  const handleTabChange = async (nextTab: Tab) => {
    if (nextTab === "explore" || isAuthenticated) {
      setTab(nextTab);
      if (nextTab !== "profile") setShowClubOnboarding(false);
      return;
    }

    setAuthReturnTab(nextTab);
    setTab("profile");
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowClubOnboarding(true);
    setTab("profile");
    void fetchUserContext().then(setUserContext).catch(() => undefined);
  };

  const hasClub = Boolean(userContext?.clubs.length);

  return (
    <>
      {tab === "explore" && <ExploreScreen />}
      {tab === "create" && <CreateTeamFlow />}
      {tab === "profile" && !isAuthenticated && (
        <AuthPanel
          onBack={() => setTab("explore")}
          onAuthenticated={handleAuthenticated}
        />
      )}
      {tab === "profile" && isAuthenticated && showClubOnboarding && (
        <ClubOnboarding
          onBack={() => setTab("explore")}
          onCustomize={() => {
            setShowClubOnboarding(false);
            setTab("create");
          }}
          onSkip={() => {
            setShowClubOnboarding(false);
            setTab("explore");
          }}
        />
      )}
      {tab === "profile" && isAuthenticated && !showClubOnboarding && (
        <ProfileDashboard
          email={userContext?.user.email}
          hasClub={hasClub}
          onCreateClub={() => setTab("create")}
          onSignOut={() => {
            void getSupabaseBrowserClient().auth.signOut();
            setIsAuthenticated(false);
            setTab("explore");
          }}
        />
      )}

      <BottomNav active={tab} onChange={handleTabChange} />
    </>
  );
}
