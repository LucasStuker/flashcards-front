"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "../../components/BrandMark";
import { login } from "../../lib/api";
import { getToken } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <BrandMark size="lg" href={null} />
        <p className="text-sm text-muted">
          Entre para gerar e estudar os seus flashcards.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-panel px-3 py-3 text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-panel px-3 py-3 text-ink outline-none focus:border-accent"
          />
        </label>

        {error ? (
          <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
