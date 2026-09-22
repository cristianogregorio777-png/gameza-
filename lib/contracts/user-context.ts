export type OnboardingStatus = "not_started" | "in_progress" | "complete";
export type ClubRole = "owner" | "manager" | "member";
export type AccountStatus = "active" | "suspended";

export interface UserContext {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
  };
  account: {
    status: AccountStatus;
    onboarding: OnboardingStatus;
    createdAt: string;
  };
  capabilities: {
    canCreateClub: boolean;
    canEditClub: boolean;
    canRequestMatch: boolean;
    canModerate: boolean;
    canManageSettings: boolean;
  };
  navigation: Array<{
    id: "explore" | "club" | "profile";
    href: string;
    label: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    role: ClubRole;
    status: "active" | "invited" | "removed";
  }>;
  meta: {
    contextVersion: 1;
    generatedAt: string;
    requestId: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}
