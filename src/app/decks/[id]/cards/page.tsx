"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import {
  Deck,
  Flashcard,
  deleteCard,
  getDeck,
  getFlashcards,
  updateCard,
} from "../../../../lib/api";

export default function DeckCardsPage() {
  const params = useParams<{ id: string }>();
  const deckId = params.id;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(
    async (q: string) => {
      try {
        const [nextDeck, nextCards] = await Promise.all([
          getDeck(deckId),
          getFlashcards(deckId, q),
        ]);
        setDeck(nextDeck);
        setCards(nextCards);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar");
      } finally {
        setLoading(false);
      }
    },
    [deckId],
  );

  useEffect(() => {
    void load("");
  }, [load]);

  const locked = deck?.status === "processing";

  function startEdit(card: Flashcard) {
    setEditingId(card._id);
    setFront(card.front);
    setBack(card.back);
    setError(null);
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || saving || locked) return;
    setSaving(true);
    try {
      const updated = await updateCard(editingId, { front, back });
      setCards((prev) => prev.map((card) => (card._id === updated._id ? { ...card, ...updated } : card)));
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspended(card: Flashcard) {
    if (locked) return;
    try {
      const updated = await updateCard(card._id, { suspended: !card.suspended });
      setCards((prev) => prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao suspender");
    }
  }

  async function remove(card: Flashcard) {
    if (locked) return;
    try {
      await deleteCard(card._id);
      setCards((prev) => prev.filter((item) => item._id !== card._id));
      setDeck((prev) =>
        prev ? { ...prev, cardCount: Math.max(0, prev.cardCount - 1) } : prev,
      );
      setConfirmingId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
    }
  }

  return (
    <AppShell>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/decks/${deckId}`} className="text-sm font-medium text-accent hover:text-accent-deep">
            ← Estudar
          </Link>
          <h1
            className="truncate text-xl text-ink"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {deck?.title ?? "Cards"}
          </h1>
        </div>
        <p className="text-sm tabular-nums text-muted">{cards.length}</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query);
        }}
      >
        <label className="sr-only" htmlFor="card-search">
          Buscar cards
        </label>
        <input
          id="card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Texto ou tag"
          className="min-w-0 flex-1 border border-line bg-paper px-2 py-1.5 text-sm text-ink"
        />
        <button
          type="submit"
          className="bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          Buscar
        </button>
      </form>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Carregando cards…</p>
      ) : cards.length === 0 ? (
        <p className="border border-line bg-panel px-4 py-5 text-sm text-muted">
          Nenhum card encontrado.
        </p>
      ) : (
        <ul className="flex flex-col border border-line bg-panel">
          {cards.map((card) => (
            <li key={card._id} className="border-b border-line/70 px-3 py-3 last:border-0">
              {editingId === card._id ? (
                <form onSubmit={(event) => void saveEdit(event)} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-ink" htmlFor={`front-${card._id}`}>
                    Pergunta
                    <textarea
                      id={`front-${card._id}`}
                      value={front}
                      onChange={(event) => setFront(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      required
                      className="mt-1 w-full border border-line bg-paper px-2 py-1 text-sm font-normal"
                    />
                  </label>
                  <label className="text-sm font-medium text-ink" htmlFor={`back-${card._id}`}>
                    Resposta
                    <textarea
                      id={`back-${card._id}`}
                      value={back}
                      onChange={(event) => setBack(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      required
                      className="mt-1 w-full border border-line bg-paper px-2 py-1 text-sm font-normal"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-accent px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className={`text-sm text-ink ${card.suspended ? "text-muted" : ""}`}>
                    {card.front}
                  </p>
                  <p className="text-sm text-muted">{card.back}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {card.suspended ? <span className="text-warn">Suspenso</span> : null}
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => startEdit(card)}
                      className="font-medium text-muted hover:text-ink disabled:opacity-40"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => void toggleSuspended(card)}
                      className="font-medium text-muted hover:text-ink disabled:opacity-40"
                    >
                      {card.suspended ? "Reativar" : "Suspender"}
                    </button>
                    {confirmingId === card._id ? (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => void remove(card)}
                        className="font-semibold text-bad disabled:opacity-40"
                      >
                        Confirmar exclusão
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => setConfirmingId(card._id)}
                        className="font-medium text-muted hover:text-bad disabled:opacity-40"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
