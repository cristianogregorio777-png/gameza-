"use client";

import { ArrowRight, LogOut, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient, uploadProfileAvatar } from "../lib/supabase-browser";

interface ProfileDashboardProps {
  email?: string;
  hasClub: boolean;
  onCreateClub: () => void;
  onSignOut: () => void;
}

export default function ProfileDashboard({ email, hasClub, onCreateClub, onSignOut }: ProfileDashboardProps) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().auth.getSession()
      .then(({ data }) => {
        if (!data.session) throw new Error("Inicia sessão para editar o perfil.");
        return fetch("/api/user/profile", { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" });
      })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Não foi possível carregar o perfil.");
        if (active) {
          setDisplayName(payload.profile.displayName || "");
          setBio(payload.profile.bio || "");
          setAvatarUrl(payload.profile.avatarUrl || null);
        }
      })
      .catch((error) => active && setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível carregar o perfil." }))
      .finally(() => active && setIsLoading(false));

    return () => { active = false; };
  }, []);

  const saveProfile = async () => {
    setFeedback(null);
    if (displayName.trim().length < 2 || displayName.trim().length > 80) {
      setFeedback({ kind: "error", message: "O nome deve ter entre 2 e 80 caracteres." });
      return;
    }
    if (bio.length > 240) {
      setFeedback({ kind: "error", message: "A bio deve ter no máximo 240 caracteres." });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("A sessão expirou. Entra novamente.");
      let nextAvatarUrl = avatarUrl;
      if (avatarFile) nextAvatarUrl = await uploadProfileAvatar(avatarFile, data.session.user.id);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ displayName, bio, avatarUrl: nextAvatarUrl }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Não foi possível guardar o perfil.");

      setAvatarUrl(payload.profile.avatarUrl || null);
      setAvatarFile(null);
      setFeedback({ kind: "success", message: "Perfil guardado com sucesso." });
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível guardar o perfil." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-screen px-4 pb-28 pt-6 lg:flex lg:min-h-[calc(100vh-2rem)] lg:items-center lg:justify-center">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange text-cream">
            <UserRound size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Perfil</p>
            <h1 className="mt-1 text-xl font-semibold text-ink">A tua conta</h1>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">Email</p>
          <p className="mt-2 break-all text-sm text-ink">{email || "Conta Raios"}</p>
        </div>

        <div className="mt-3 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
          <div className="flex items-center gap-3">
            <label className="flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-cream/20 bg-navy-deep text-ink-mute">
              {avatarUrl ? <Image src={avatarUrl} alt="Avatar do perfil" width={56} height={56} unoptimized className="h-full w-full object-cover" /> : <UserRound size={20} />}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024)) {
                  setFeedback({ kind: "error", message: "Escolhe PNG, JPG ou WebP com no máximo 2 MB." });
                  return;
                }
                setAvatarFile(file);
                if (file) setAvatarUrl(URL.createObjectURL(file));
              }} />
            </label>
            <div>
              <p className="text-sm font-semibold text-ink">Identidade do perfil</p>
              <p className="mt-1 text-xs text-ink-mute">Nome, avatar e bio curta.</p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-ink-mute">Nome de exibição</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} className="field-input" placeholder="O teu nome" disabled={isLoading} />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-ink-mute">Bio</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} className="field-input resize-none" placeholder="Uma frase sobre ti" disabled={isLoading} />
            <span className="mt-1 block text-right text-[11px] text-ink-faint">{bio.length}/240</span>
          </label>
          <button onClick={saveProfile} disabled={isLoading || isSaving} className="mt-3 w-full rounded-pill bg-orange py-3 text-sm font-bold text-cream disabled:opacity-50">
            {isSaving ? "A guardar…" : "Guardar perfil"}
          </button>
          {feedback && <p className={`mt-3 text-sm ${feedback.kind === "success" ? "text-cream" : "text-danger"}`}>{feedback.message}</p>}
        </div>

        <div className="mt-3 rounded-[22px] border border-cream/15 bg-navy-soft p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive text-cream">
              <Shield size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{hasClub ? "O teu clube" : "Ainda não tens um clube"}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-mute">
                {hasClub ? "Acede ao dashboard para gerir identidade e jogos." : "Cria um clube quando estiveres pronto para marcar jogos."}
              </p>
            </div>
          </div>
          {!hasClub && (
            <button onClick={onCreateClub} className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-orange py-3 text-sm font-bold text-cream">
              Criar clube
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <button onClick={onSignOut} className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink-mute hover:text-ink">
          <LogOut size={16} />
          Terminar sessão
        </button>
      </div>
    </section>
  );
}
