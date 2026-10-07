"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Stats, getStats } from "../../lib/api";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Falha ao carregar");
      });
  }, []);

  const retention =
    stats?.retention == null ? "—" : `${Math.round(stats.retention * 100)}%`;

  return (
    <AppShell>
      <h1
        className="text-xl text-ink"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Estatísticas
      </h1>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {!stats && !error ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : null}

      {stats ? (
        <>
          <dl className="grid grid-cols-3 border border-line bg-panel text-sm">
            <div className="border-r border-line px-3 py-3">
              <dt className="text-xs text-muted">Hoje</dt>
              <dd className="mt-1 text-lg tabular-nums text-ink">{stats.reviewsToday}</dd>
            </div>
            <div className="border-r border-line px-3 py-3">
              <dt className="text-xs text-muted">Retenção</dt>
              <dd className="mt-1 text-lg tabular-nums text-ink">{retention}</dd>
            </div>
            <div className="px-3 py-3">
              <dt className="text-xs text-muted">Sequência</dt>
              <dd className="mt-1 text-lg tabular-nums text-ink">{stats.streak}</dd>
            </div>
          </dl>

          <table className="w-full border border-line bg-panel text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Dia</th>
                <th className="px-3 py-2 font-medium">Cards</th>
              </tr>
            </thead>
            <tbody>
              {stats.forecast.map((day) => (
                <tr key={day.date} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-2 text-ink">{formatDay(day.date)}</td>
                  <td className="px-3 py-2 tabular-nums text-muted">{day.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </AppShell>
  );
}
