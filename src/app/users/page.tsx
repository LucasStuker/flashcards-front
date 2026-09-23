"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AuthGate } from "../../components/AuthGate";
import { AuthUser } from "../../lib/auth";
import { createAdmin, listUsers, updateUser } from "../../lib/api";

function UsersContent() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao listar admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAdmin(email, password);
      setEmail("");
      setPassword("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar admin");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: AuthUser) {
    setError(null);
    try {
      await updateUser(user._id, { active: !user.active });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar");
    }
  }

  async function resetPassword(user: AuthUser) {
    const next = window.prompt(`Nova senha para ${user.email}`);
    if (!next || next.length < 6) return;
    setError(null);
    try {
      await updateUser(user._id, { password: next });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao resetar senha");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <AppHeader />

      <header>
        <h1
          className="text-3xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Admins
        </h1>
        <p className="mt-2 text-sm text-muted">
          Só o super admin cria e gerencia contas. Cada admin vê só os próprios
          decks.
        </p>
      </header>

      <form onSubmit={onCreate} className="grid gap-3 border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Novo admin</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span>E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-fit bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {saving ? "Criando…" : "Criar admin"}
        </button>
      </form>

      {error ? (
        <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted">Nenhum admin cadastrado ainda.</p>
      ) : (
        <ul className="grid gap-3">
          {users.map((user) => (
            <li
              key={user._id}
              className="flex flex-col gap-3 border border-line bg-panel px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">{user.email}</p>
                <p className="text-sm text-muted">
                  {user.active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void toggleActive(user)}
                  className="border border-line px-3 py-2 text-sm font-medium hover:border-accent"
                >
                  {user.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => void resetPassword(user)}
                  className="border border-line px-3 py-2 text-sm font-medium hover:border-accent"
                >
                  Resetar senha
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function UsersPage() {
  return (
    <AuthGate requireSuperAdmin>
      <UsersContent />
    </AuthGate>
  );
}
