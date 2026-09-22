"use client";

import Image from "next/image";
import { Users, MapPin } from "lucide-react";
import { Team } from "../lib/types";

interface TeamCardProps {
  team: Team;
  onMarcarJogo: (team: Team) => void;
}

export default function TeamCard({ team, onMarcarJogo }: TeamCardProps) {
  const isLarge = team.size === "lg";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-card border border-line",
        "bg-white/[0.045] backdrop-blur-glass p-4 flex flex-col justify-between",
        isLarge ? "col-span-2 min-h-[168px]" : "col-span-1 min-h-[168px]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-line bg-surface">
            <Image
              src={team.logoUrl}
              alt={`Escudo do ${team.name}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-lg leading-tight text-ink">
              {team.name}
            </p>
            <p className="font-body flex items-center gap-1 text-xs text-ink-mute mt-0.5">
              <MapPin size={12} />
              {team.origin}
            </p>
          </div>
        </div>

        <span className="font-body shrink-0 rounded-pill border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] font-medium text-cyan">
          {team.fieldType}
        </span>
      </div>

      {isLarge && team.description && (
        <p className="font-body mt-3 line-clamp-2 text-sm text-ink-mute">
          {team.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="font-body flex items-center gap-1.5 text-xs text-ink-mute">
          <Users size={14} />
          {team.playersCount} jogadores
        </span>

        <button
          onClick={() => onMarcarJogo(team)}
          className="font-body rounded-pill bg-lime px-4 py-2 text-[13px] font-semibold text-base transition-transform active:scale-95"
        >
          Marcar jogo
        </button>
      </div>
    </div>
  );
}
