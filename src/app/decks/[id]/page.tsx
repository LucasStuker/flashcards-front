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
  const progress = useMemo(() => {
    if (cards.length === 0) return "0/0";
    return `${index + 1}/${cards.length}`;
  }, [cards.length, index]);

  async function onReview(rating: "again" | "hard" | "good" | "easy") {
    if (!current) return;
    try {
      await reviewCard(current._id, rating);
      setFlipped(false);
      setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar revisão");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-muted">Carregando…</main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-bad">{error}</p>
        <Link href="/" className="mt-4 inline-block text-accent">
          Voltar
        </Link>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted">Este deck ainda não tem flashcards.</p>
        <Link href="/" className="mt-4 inline-block text-accent">
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-medium text-accent hover:text-accent-deep">
          ← Decks
        </Link>
        <p className="text-sm text-muted">{progress}</p>
      </div>

      <header>
        <h1
          className="text-3xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {deck?.title ?? "Estudar"}
        </h1>
        {current.topic ? (
          <p className="mt-2 text-sm text-muted">Tópico: {current.topic}</p>
        ) : null}
      </header>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="min-h-64 border border-line bg-panel px-6 py-8 text-left transition hover:border-accent/50"
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-accent uppercase">
          {flipped ? "Resposta" : "Pergunta"}
        </p>
        <p className="text-xl leading-relaxed text-ink whitespace-pre-wrap">
          {flipped ? current.back : current.front}
        </p>
        <p className="mt-8 text-sm text-muted">Clique para virar</p>
      </button>

      {current.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {current.tags.map((tag) => (
            <span
              key={tag}
              className="border border-line px-2 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            onClick={() => void onReview(rating)}
            className="border border-line bg-white px-3 py-3 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
          >
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
