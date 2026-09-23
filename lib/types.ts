export type FieldType = "Futsal" | "Futebol 11" | "Society";

export type AssociationType = "Bairro" | "Escola";

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  origin: string; // ex: "Camama", "IMPTEL"
  associationType: AssociationType;
  fieldType: FieldType;
  playersCount: number;
  captainName: string;
  canRequestMatch?: boolean;
  description?: string;
  /** controla o span no bento grid */
  size?: "sm" | "lg";
}

export interface MatchRequest {
  teamId: string;
  date: string;
  time: string;
  suggestedLocation: string;
}

export interface ModerationResult {
  flagged: boolean;
  reason: string;
}

export interface NewTeamDraft {
  name: string;
  logoFile: File | null;
  logoPreview: string | null;
  associationType: AssociationType;
  origin: string;
  location: string;
  fieldType: FieldType;
  whatsapp: string;
  description: string;
}
