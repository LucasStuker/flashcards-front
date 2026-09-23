"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { StudyCard } from "../../../components/StudyCard";
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
      <AppShell maxWidth="study">
        <p className="text-sm text-muted" aria-live="polite">
          Carregando deck…
        </p>
      </AppShell>
    );
  }

  if (error && !current) {
    return (
      <AppShell maxWidth="study">
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      </AppShell>
    );
  }

  if (!current) {
    return (
      <AppShell maxWidth="study">
        <h1
          className="text-xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {deck?.title ?? "Estudar"}
        </h1>
        <p className="border border-line bg-panel px-4 py-5 text-sm text-muted">
          Este deck ainda não tem flashcards.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell maxWidth="study">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-sm font-medium text-accent hover:text-accent-deep"
          >
            ← Decks
          </Link>
          <h1
            className="truncate text-lg text-ink"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {deck?.title ?? "Estudar"}
          </h1>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-muted" aria-live="polite">
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

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      <StudyCard
        card={current}
        flipped={flipped}
        reviewing={reviewing}
        onFlip={() => setFlipped((v) => !v)}
        onReview={(rating) => void onReview(rating)}
      />
    </AppShell>
  );
}
