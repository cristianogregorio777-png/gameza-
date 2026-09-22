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
    <div className="mt-6 px-4">
      <div className="flex items-center gap-2 rounded-pill border border-line bg-white/[0.04] px-4 py-3 backdrop-blur-glass">
        <Search size={18} className="text-ink-mute" />
        <input
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
                  ? "border-lime bg-lime text-base"
                  : "border-line bg-white/[0.03] text-ink-mute hover:text-ink",
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
