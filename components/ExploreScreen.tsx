"use client";

import { useMemo, useState } from "react";
import HeroBanner from "./HeroBanner";
import SearchFilters from "./SearchFilters";
import TeamCard from "./TeamCard";
import MatchModal from "./MatchModal";
import { TEAMS, FILTER_PILLS } from "../lib/mock-data";
import { Team } from "../lib/types";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTER_PILLS)[number]>("Todos");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredTeams = useMemo(() => {
    return TEAMS.filter((team) => {
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
  }, [query, activeFilter]);

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
        <div className="mt-5 px-4">
          <div className="grid grid-cols-2 gap-3">
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
