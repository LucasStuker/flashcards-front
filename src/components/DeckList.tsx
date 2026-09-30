"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Deck } from "../lib/api";

type Props = {
  decks: Deck[];
  loading: boolean;
  hasProcessing: boolean;
  empty: ReactNode;
};

function statusLabel(status: Deck["status"]) {
  if (status === "ready") return "Pronto";
  if (status === "processing") return "Gerando…";
  return "Erro";
}

function statusClass(status: Deck["status"]) {
  if (status === "ready") return "text-ok";
  if (status === "processing") return "text-warn";
  return "text-bad";
}

export function DeckList({ decks, loading, hasProcessing, empty }: Props) {
  if (loading) {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        Carregando decks…
      </p>
    );
  }

  if (decks.length === 0) return <>{empty}</>;

  return (
    <section aria-labelledby="decks-heading">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h1
          id="decks-heading"
          className="text-xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Decks
        </h1>
        {hasProcessing ? (
          <p className="text-sm text-warn" aria-live="polite">
            Gerando cards…
          </p>
        ) : (
          <p className="text-sm text-muted tabular-nums">{decks.length}</p>
        )}
      </div>

      <div className="overflow-x-auto border border-line bg-panel">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Cards</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {decks.map((deck) => (
              <tr
                key={deck._id}
                className="border-b border-line/70 last:border-0"
              >
                <td className="max-w-0 px-3 py-2">
                  <p className="truncate font-medium text-ink">{deck.title}</p>
                  {deck.generationNote ? (
                    <p className="truncate text-xs text-muted">
                      {deck.generationNote}
                    </p>
                  ) : null}
                  {deck.errorMessage ? (
                    <p className="truncate text-xs text-bad">{deck.errorMessage}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">
                  {deck.cardCount}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 font-medium ${statusClass(deck.status)}`}>
                  {statusLabel(deck.status)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {deck.status === "ready" ? (
                    <Link
                      href={`/decks/${deck._id}`}
                      className="inline-flex bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-deep"
                    >
                      Estudar
                    </Link>
                  ) : deck.status === "processing" ? (
                    <span className="text-xs text-warn">Aguarde</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
