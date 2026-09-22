"use client";

import { useState } from "react";
import BottomNav, { Tab } from "../components/BottomNav";
import ExploreScreen from "../components/ExploreScreen";
import CreateTeamFlow from "../components/CreateTeamFlow";

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");

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

      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}
