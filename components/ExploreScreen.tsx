"use client";

import { useEffect, useMemo, useState } from "react";
import HeroBanner from "./HeroBanner";
import SearchFilters from "./SearchFilters";
import TeamCard from "./TeamCard";
import MatchModal from "./MatchModal";
import { FILTER_PILLS } from "../lib/mock-data";
import { Team } from "../lib/types";

export default function ExploreScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTER_PILLS)[number]>("Todos");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/teams", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Não foi possível carregar os times.");
        if (active) setTeams(payload.items as Team[]);
      })
      .catch((error) => console.error("[explore] teams load failed", error));

    return () => {
      active = false;
    };
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesQuery =
        query.trim().length === 0 ||
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.origin.toLowerCase().includes(query.toLowerCase());

      const matchesFilter =
        activeFilter === "Todos" ||
        (activeFilter === "Escolas" && team.associationType === "Escola") ||
        (activeFilter === "Bairros" && team.associationType === "Bairro") ||
        team.fieldType === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [teams, query, activeFilter]);

  return (
    <div className="texture-noise min-h-screen pb-32">
      <HeroBanner
        athleteSrc="/jogadores/19c43605-1413-41a1-84d0-ed9bc22a3a66-Photoroom.png"
      />

      <SearchFilters
        query={query}
        onQueryChange={setQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {filteredTeams.length > 0 && (
        <div className="mx-auto mt-5 max-w-[960px] px-4 lg:px-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} onMarcarJogo={setSelectedTeam} />
            ))}
          </div>
        </div>
      )}

      <MatchModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
    </div>
  );
}
