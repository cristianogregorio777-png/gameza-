"use client";

import { useMemo, useState } from "react";
import HeroBanner from "./HeroBanner";
import SearchFilters from "./SearchFilters";
import TeamCard from "./TeamCard";
import MatchModal from "./MatchModal";
import { MOCK_TEAMS, FILTER_PILLS } from "../lib/mock-data";
import { Team } from "../lib/types";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTER_PILLS)[number]>("Todos");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredTeams = useMemo(() => {
    return MOCK_TEAMS.filter((team) => {
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
      <HeroBanner teamCount={MOCK_TEAMS.length} />

      <SearchFilters
        query={query}
        onQueryChange={setQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <div className="mt-5 px-4">
        <p className="font-body mb-3 text-sm font-medium text-ink-mute">
          {filteredTeams.length} times disponíveis
        </p>

        {filteredTeams.length === 0 ? (
          <div className="rounded-card border border-dashed border-line py-14 text-center">
            <p className="font-body text-sm text-ink-mute">
              Nenhum time encontrado com esses filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} onMarcarJogo={setSelectedTeam} />
            ))}
          </div>
        )}
      </div>

      <MatchModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
    </div>
  );
}
