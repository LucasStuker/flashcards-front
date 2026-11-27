"use client";

import { FormEvent, useEffect, useState } from "react";
import { useStoredUser } from "@/components/AuthGate";
import { PageContainer } from "@/components/PageContainer";
import { changeOwnPassword, updateMe } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";

const inputClass = "border border-line bg-panel px-3 py-2 outline-none focus:border-accent";
const submitClass =
  "bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60";

function Feedback({ error, ok }: { error: string | null; ok: string | null }) {
  if (error) {
    return <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">{error}</p>;
  }
  if (ok) {
    return <p className="border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">{ok}</p>;
  }
  return null;
}

function NameForm() {
  const user = useStoredUser();
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNome(user?.nome ?? "");
  }, [user?.nome]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const updated = await updateMe(nome);
      setStoredUser(updated);
      setOk(updated.nome ? "Nome atualizado." : "Nome removido.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar o nome");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-labelledby="conta-nome">
      <h2 id="conta-nome" className="text-sm font-semibold text-ink">
        Nome
      </h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Como você quer ser chamado na sidebar</span>
        <input
          type="text"
          maxLength={80}
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
      </label>
      <Feedback error={error} ok={ok} />
      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? "Salvando…" : "Salvar nome"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setOk("Senha atualizada.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-labelledby="conta-senha">
      <h2 id="conta-senha" className="text-sm font-semibold text-ink">
        Senha
      </h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Senha atual</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Nova senha</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <Feedback error={error} ok={ok} />
      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}

export default function AccountPage() {
  return (
    <PageContainer maxWidth="md">
      <header>
        <h1
          className="text-xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Conta
        </h1>
        <p className="mt-1 text-sm text-muted">Seu nome e sua senha.</p>
      </header>
      <NameForm />
      <hr className="border-line" />
      <PasswordForm />
    </PageContainer>
  );
}
