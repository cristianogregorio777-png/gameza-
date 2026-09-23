"use client";

import Image from "next/image";
import { Building2, MapPin, Users } from "lucide-react";
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
        "group relative overflow-hidden rounded-card border border-cream/15",
        "bg-navy-soft/70 p-4 flex flex-col justify-between",
        isLarge ? "col-span-2 min-h-[168px]" : "col-span-1 min-h-[168px]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamBadge team={team} />
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-bold leading-tight text-cream">
              {team.name}
            </p>
            <p className="font-body mt-0.5 flex items-center gap-1 text-xs text-ink-mute">
              <MapPin size={12} />
              {team.origin}
            </p>
          </div>
        </div>

        <span className="font-body shrink-0 rounded-pill border border-olive bg-olive/30 px-2.5 py-1 text-[11px] font-medium text-cream">
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
          className="font-body rounded-pill bg-orange px-4 py-2 text-[13px] font-bold text-cream transition-transform active:scale-95"
        >
          Marcar jogo
        </button>
      </div>
    </div>
  );
}

function TeamBadge({ team }: { team: Team }) {
  const initials = team.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (team.logoUrl) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-cream/15 bg-navy-deep">
        <Image
          src={team.logoUrl}
          alt={`Escudo do ${team.name}`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={[
        "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-bold",
        team.associationType === "Escola"
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-orange/50 bg-orange/10 text-orange",
      ].join(" ")}
      aria-label={`Identidade visual de ${team.name}`}
    >
      <span className="font-display text-lg tracking-wide">{initials}</span>
      <span className="absolute -right-1 -top-1 opacity-50">
        <Building2 size={13} />
      </span>
    </div>
  );
}
