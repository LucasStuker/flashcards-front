"use client";

import { FormEvent, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AuthGate } from "../../components/AuthGate";
import { changeOwnPassword } from "../../lib/api";

function AccountContent() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setOk(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-8 px-6 py-10">
      <AppHeader />
      <header>
        <h1
          className="text-3xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Alterar senha
        </h1>
        <p className="mt-2 text-sm text-muted">
          Qualquer admin pode trocar a própria senha.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Senha atual</span>
          <input
            type="password"
            required
            minLength={6}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border border-line bg-panel px-3 py-3 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Nova senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-line bg-panel px-3 py-3 outline-none focus:border-accent"
          />
        </label>

        {error ? (
          <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">
            Senha atualizada.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </main>
  );
}

export default function AccountPage() {
  return (
    <AuthGate>
      <AccountContent />
    </AuthGate>
  );
}
