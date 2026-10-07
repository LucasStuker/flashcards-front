"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell } from "../../../components/AppShell";
import { StudyCard } from "../../../components/StudyCard";
import {
  Deck,
  Flashcard,
  ReviewRating,
  createCard,
  deleteCard,
  getDeck,
  getStudy,
  renameDeck,
  reviewCard,
  StudyScope,
  undoReview,
} from "../../../lib/api";

const ratingByKey: Record<string, ReviewRating> = {
  a: "again",
  s: "hard",
  w: "good",
  d: "easy",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [adding, setAdding] = useState(false);
  const [frontDraft, setFrontDraft] = useState("");
  const [backDraft, setBackDraft] = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nextDueAt, setNextDueAt] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [scope, setScope] = useState<StudyScope>("all");

  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    try {
      const [d, study] = await Promise.all([getDeck(deckId), getStudy(deckId, scope)]);
      if (generation !== loadGeneration.current) return;
      setDeck(d);
      setCards(study.cards);
      setNextDueAt(study.nextDueAt);
      setError(null);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [deckId, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setConfirmingDelete(false);
  }, [scope]);

  useEffect(() => {
    if (cards.length > 0 || !nextDueAt) return;
    const id = window.setInterval(() => {
      setNowTick(Date.now());
      void load();
    }, 2000);
    return () => window.clearInterval(id);
  }, [cards.length, load, nextDueAt]);

  const safeIndex = cards.length === 0 ? 0 : Math.min(index, cards.length - 1);
  const current = cards[safeIndex];
  const locked = deck?.status === "processing";

  const progressLabel = useMemo(() => {
    if (cards.length === 0) return "0 / 0";
    return `${safeIndex + 1} / ${cards.length}`;
  }, [cards.length, safeIndex]);

  const go = useCallback((delta: number) => {
    setFlipped(false);
    setConfirmingDelete(false);
    setIndex((i) => {
      const n = cardsRef.current.length;
      if (n <= 1) return 0;
      const currentIndex = Math.min(i, n - 1);
      return (currentIndex + delta + n) % n;
    });
  }, []);

  const onReview = useCallback(
    async (rating: ReviewRating) => {
      const card = cardsRef.current[Math.min(index, Math.max(cardsRef.current.length - 1, 0))];
      if (!card || reviewing) return;
      const reviewedIndex = Math.min(index, Math.max(cardsRef.current.length - 1, 0));
      setReviewing(true);
      try {
        await reviewCard(card._id, rating);
        const study = await getStudy(deckId, scope);
        setCards(study.cards);
        setNextDueAt(study.nextDueAt);
        if (scope === "all") {
          const last = Math.max(study.cards.length - 1, 0);
          setIndex(Math.min(reviewedIndex + 1, last));
        } else {
          setIndex(0);
        }
        setFlipped(false);
        setConfirmingDelete(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao registrar revisão");
      } finally {
        setReviewing(false);
      }
    },
    [deckId, index, reviewing, scope],
  );

  const undoLast = useCallback(async () => {
    if (undoing || reviewing) return;
    setUndoing(true);
    try {
      const undone = await undoReview();
      const study = await getStudy(deckId, scope);
      setCards(study.cards);
      setNextDueAt(study.nextDueAt);
      if (scope === "all") {
        const found = study.cards.findIndex((item) => item._id === undone._id);
        setIndex(found >= 0 ? found : 0);
      } else {
        setIndex(0);
      }
      setFlipped(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao desfazer");
    } finally {
      setUndoing(false);
    }
  }, [deckId, reviewing, scope, undoing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (reviewing || deleting || undoing) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button") &&
        (event.key === " " || event.key === "Enter")
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.repeat) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        void undoLast();
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        if (current && !flipped) setFlipped(true);
        return;
      }
      if (!flipped || !current) return;
      const rating = ratingByKey[event.key.toLowerCase()];
      if (!rating) return;
      event.preventDefault();
      void onReview(rating);
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [current, deleting, flipped, go, onReview, reviewing, undoLast, undoing]);

  async function saveTitle(event: FormEvent) {
    event.preventDefault();
    const title = titleDraft.trim();
    if (!title || savingTitle || locked) return;
    setSavingTitle(true);
    try {
      const updated = await renameDeck(deckId, title);
      setDeck(updated);
      setEditingTitle(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao renomear");
    } finally {
      setSavingTitle(false);
    }
  }

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    if (savingCard || locked) return;
    const front = frontDraft.trim();
    const back = backDraft.trim();
    if (!front || !back) {
      setError("Informe pergunta e resposta.");
      return;
    }
    setSavingCard(true);
    try {
      const created = await createCard(deckId, front, back);
      const study = await getStudy(deckId, scope);
      setCards(study.cards);
      setNextDueAt(study.nextDueAt);
      const createdIndex = study.cards.findIndex((item) => item._id === created._id);
      setIndex(createdIndex >= 0 ? createdIndex : 0);
      setFlipped(false);
      setFrontDraft("");
      setBackDraft("");
      setAdding(false);
      setDeck((prev) =>
        prev
          ? {
              ...prev,
              cardCount: prev.cardCount + 1,
              status: prev.status === "error" ? "ready" : prev.status,
              errorMessage: prev.status === "error" ? undefined : prev.errorMessage,
            }
          : prev,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar card");
    } finally {
      setSavingCard(false);
    }
  }

  async function removeCurrent() {
    if (!current || deleting || locked) return;
    setDeleting(true);
    try {
      const removedIndex = Math.min(index, Math.max(cards.length - 1, 0));
      await deleteCard(current._id);
      const study = await getStudy(deckId, scope);
      setCards(study.cards);
      setNextDueAt(study.nextDueAt);
      if (scope === "all") {
        setIndex(Math.min(removedIndex, Math.max(study.cards.length - 1, 0)));
      } else {
        setIndex(0);
      }
      setFlipped(false);
      setConfirmingDelete(false);
      setDeck((prev) =>
        prev ? { ...prev, cardCount: Math.max(0, prev.cardCount - 1) } : prev,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir card");
    } finally {
      setDeleting(false);
    }
  }

  const deckEmpty = (deck?.cardCount ?? 0) === 0;
  const showComposer = adding || deckEmpty;
  const waitSeconds = nextDueAt
    ? Math.max(0, Math.ceil((new Date(nextDueAt).getTime() - nowTick) / 1000))
    : 0;

  if (loading) {
    return (
      <AppShell maxWidth="study">
        <p className="text-sm text-muted" aria-live="polite">
          Carregando deck…
        </p>
      </AppShell>
    );
  }

  if (error && !deck) {
    return (
      <AppShell maxWidth="study">
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      </AppShell>
    );
  }

  const progressPct = cards.length === 0 ? 0 : ((safeIndex + 1) / cards.length) * 100;

  return (
    <AppShell maxWidth="study">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-accent hover:text-accent-deep"
          >
            ← Decks
          </Link>
          {cards.length > 0 ? (
            <p className="shrink-0 text-sm tabular-nums text-muted" aria-live="polite">
              {progressLabel}
            </p>
          ) : null}
        </div>
        {editingTitle ? (
          <form onSubmit={(event) => void saveTitle(event)} className="flex gap-2">
            <label className="sr-only" htmlFor="deck-title">
              Nome do deck
            </label>
            <input
              id="deck-title"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditingTitle(false);
              }}
              maxLength={120}
              autoFocus
              className="min-w-0 flex-1 border border-line bg-paper px-2 py-1 text-lg text-ink"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            />
            <button
              type="submit"
              disabled={savingTitle || titleDraft.trim().length === 0}
              className="bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              Salvar
            </button>
          </form>
        ) : (
          <h1
            className="line-clamp-2 text-lg leading-snug text-ink"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {deck?.title ?? "Estudar"}
          </h1>
        )}
        {cards.length > 0 ? (
          <div
            className="h-1 w-full bg-line"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={cards.length}
            aria-valuenow={safeIndex + 1}
            aria-label={scope === "day" ? "Posição na fila" : "Posição no deck"}
          >
            <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/decks/${deckId}/cards`}
            className="text-xs font-medium text-muted hover:text-ink"
          >
            Cards
          </Link>
          <button
            type="button"
            disabled={locked}
            title={locked ? "Aguarde a geração terminar" : undefined}
            onClick={() => {
              setTitleDraft(deck?.title ?? "");
              setEditingTitle(true);
            }}
            className="text-xs font-medium text-muted hover:text-ink disabled:opacity-40"
          >
            Renomear
          </button>
          <div className="ml-auto flex gap-3" role="group" aria-label="Modo de estudo">
            <button
              type="button"
              aria-pressed={scope === "all"}
              onClick={() => setScope("all")}
              className={`border-b py-1 text-xs font-medium ${
                scope === "all"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Deck inteiro
            </button>
            <button
              type="button"
              aria-pressed={scope === "day"}
              onClick={() => setScope("day")}
              className={`border-b py-1 text-xs font-medium ${
                scope === "day"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Fila do dia
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {current ? (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Card anterior"
                disabled={cards.length < 2}
                onClick={() => go(-1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-panel text-lg text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
              >
                ‹
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-sm text-muted">
                {current.topic ?? ""}
              </p>
              <button
                type="button"
                aria-label="Próximo card"
                disabled={cards.length < 2}
                onClick={() => go(1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-panel text-lg text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
              >
                ›
              </button>
            </div>
            <StudyCard
              key={current._id}
              card={current}
              flipped={flipped}
              reviewing={reviewing}
              onFlip={() => setFlipped((value) => !value)}
              onReview={(rating) => void onReview(rating)}
            />
          </div>
          <p className="hidden text-xs text-muted sm:block">
            ← → troca o card · espaço revela · A S W D avalia · Z desfaz
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              disabled={undoing}
              onClick={() => void undoLast()}
              className="py-2 text-muted hover:text-ink disabled:opacity-40"
            >
              Desfazer
            </button>
            {confirmingDelete ? (
              <>
                <span className="text-ink">Excluir este card?</span>
                <button
                  type="button"
                  disabled={deleting || locked}
                  onClick={() => void removeCurrent()}
                  className="border border-bad px-2 py-1 font-semibold text-bad disabled:opacity-60"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="py-2 text-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={locked}
                onClick={() => setConfirmingDelete(true)}
                className="py-2 text-muted hover:text-bad disabled:opacity-40"
              >
                Excluir card
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="border border-line bg-panel px-4 py-5 text-sm text-muted">
          {deckEmpty
            ? "Este deck ainda não tem flashcards."
            : scope === "day" && nextDueAt
              ? `Próximo card em ${waitSeconds}s.`
              : scope === "day"
                ? "Deck em dia."
                : "Nenhum card ativo neste deck."}
        </p>
      )}

      {showComposer ? (
        <form
          onSubmit={(event) => void saveCard(event)}
          className="flex flex-col gap-2 border border-line bg-panel p-3"
        >
          <label className="text-sm font-medium text-ink" htmlFor="card-front">
            Pergunta
            <textarea
              id="card-front"
              value={frontDraft}
              onChange={(event) => setFrontDraft(event.target.value)}
              rows={2}
              maxLength={2000}
              required
              className="mt-1 w-full border border-line bg-paper px-2 py-1 text-sm font-normal text-ink"
            />
          </label>
          <label className="text-sm font-medium text-ink" htmlFor="card-back">
            Resposta
            <textarea
              id="card-back"
              value={backDraft}
              onChange={(event) => setBackDraft(event.target.value)}
              rows={2}
              maxLength={2000}
              required
              className="mt-1 w-full border border-line bg-paper px-2 py-1 text-sm font-normal text-ink"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={savingCard || locked}
              className="bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              Salvar card
            </button>
            {!deckEmpty ? (
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-sm text-muted hover:text-ink"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => setAdding(true)}
          className="self-start py-2 text-sm font-medium text-accent hover:text-accent-deep disabled:opacity-40"
        >
          Novo card
        </button>
      )}
    </AppShell>
  );
}
