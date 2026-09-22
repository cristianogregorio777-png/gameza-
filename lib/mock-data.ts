import { Team } from "./types";

// A origem dos times será conectada ao Supabase. Não pré-carregar dados fictícios.
export const TEAMS: Team[] = [];

export const FILTER_PILLS = [
  "Todos",
  "Escolas",
  "Bairros",
  "Futsal",
  "Futebol 11",
  "Society",
] as const;
