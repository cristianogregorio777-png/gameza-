export const HUMAN_VERIFIED_COOKIE = "raios_human_verified";
/** Duração da sessão humana verificada (2 horas). */
export const HUMAN_VERIFIED_MAX_AGE_SEC = 2 * 60 * 60;

export function hasHumanVerifiedCookie(value: string | undefined): boolean {
  return value === "1";
}
