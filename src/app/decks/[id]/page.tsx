"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Deck,
  Flashcard,
  getDeck,
  getFlashcards,
  reviewCard,
} from "../../../lib/api";

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const deckId = params.id;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([getDeck(deckId), getFlashcards(deckId)]);
      setDeck(d);
      setCards(c);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = cards[index];
  const progressLabel = useMemo(() => {
    if (cards.length === 0) return "0 / 0";
    return `${index + 1} / ${cards.length}`;
  }, [cards.length, index]);

  const progressPct = useMemo(() => {
    if (cards.length === 0) return 0;
    return Math.round(((index + 1) / cards.length) * 100);
  }, [cards.length, index]);

  async function onReview(rating: "again" | "hard" | "good" | "easy") {
    if (!current || reviewing) return;
    setReviewing(true);
    try {
      await reviewCard(current._id, rating);
      setFlipped(false);
      setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar revisão");
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
        <Link href="/" className="text-sm font-medium text-accent hover:text-accent-deep">
          ← Decks
        </Link>
        <p className="text-muted" aria-live="polite">
          Carregando deck…
        </p>
      </main>
    );
  }

  if (error && !current) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
        <Link href="/" className="text-sm font-medium text-accent hover:text-accent-deep">
          ← Decks
        </Link>
        <p role="alert" className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
        <Link href="/" className="text-sm font-medium text-accent hover:text-accent-deep">
          ← Decks
        </Link>
        <h1
          className="text-3xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {deck?.title ?? "Estudar"}
        </h1>
        <p className="border border-line bg-panel px-5 py-8 text-sm text-muted">
          Este deck ainda não tem flashcards.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-accent transition hover:text-accent-deep"
        >
          ← Decks
        </Link>
        <p className="text-sm tabular-nums text-muted" aria-live="polite">
          {progressLabel}
        </p>
      </div>

      <div
        className="h-1 w-full overflow-hidden bg-line/60"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do deck"
      >
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <header>
        <h1
          className="text-3xl text-ink md:text-4xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {deck?.title ?? "Estudar"}
        </h1>
        {current.topic ? (
          <p className="mt-2 text-sm text-muted">{current.topic}</p>
        ) : null}
      </header>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        className="study-card min-h-64 border border-line bg-panel px-6 py-8 text-left transition duration-200 hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-accent uppercase">
          {flipped ? "Resposta" : "Pergunta"}
        </p>
        <p
          key={flipped ? "back" : "front"}
          className="study-card-face text-xl leading-relaxed text-ink whitespace-pre-wrap"
        >
          {flipped ? current.back : current.front}
        </p>
        <p className="mt-8 text-sm text-muted">
          {flipped ? "Clique para ver a pergunta" : "Clique para revelar a resposta"}
        </p>
      </button>

      {current.tags?.length ? (
        <p className="text-sm text-muted">{current.tags.join(" · ")}</p>
      ) : null}

      {flipped ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Avaliar lembrança">
          {(
            [
              ["again", "Errei"],
              ["hard", "Difícil"],
              ["good", "Bom"],
              ["easy", "Fácil"],
            ] as const
          ).map(([rating, label]) => (
            <button
              key={rating}
              type="button"
              disabled={reviewing}
              onClick={() => void onReview(rating)}
              className="border border-line bg-panel px-3 py-3 text-sm font-semibold text-ink transition duration-200 hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Revele a resposta para avaliar.</p>
      )}
    </main>
  );
}
