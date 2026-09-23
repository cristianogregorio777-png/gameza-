"use client";

import { Search } from "lucide-react";
import { FILTER_PILLS } from "../lib/mock-data";

interface SearchFiltersProps {
  query: string;
  onQueryChange: (v: string) => void;
  activeFilter: (typeof FILTER_PILLS)[number];
  onFilterChange: (f: (typeof FILTER_PILLS)[number]) => void;
}

export default function SearchFilters({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
}: SearchFiltersProps) {
  return (
    <div className="mx-auto mt-6 max-w-[960px] px-4 lg:px-0">
      <div className="flex items-center gap-2 rounded-card border border-cream/15 bg-navy-deep px-4 py-3">
        <Search size={18} className="text-ink-mute" />
        <input
          aria-label="Procurar time ou bairro"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Procurar time ou bairro"
          className="font-body w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTER_PILLS.map((pill) => {
          const isActive = pill === activeFilter;
          return (
            <button
              key={pill}
              onClick={() => onFilterChange(pill)}
              className={[
                "font-body shrink-0 rounded-pill border px-4 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "border-orange bg-orange text-cream"
                  : "border-cream/15 bg-navy-soft text-ink-mute hover:border-cream/30 hover:text-cream",
              ].join(" ")}
            >
              {pill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
