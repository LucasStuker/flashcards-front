"use client";

import { Flashcard } from "../lib/api";

type Rating = "again" | "hard" | "good" | "easy";

type Props = {
  card: Flashcard;
  flipped: boolean;
  reviewing: boolean;
  onFlip: () => void;
  onReview: (rating: Rating) => void;
};

const ratings: Array<[Rating, string]> = [
  ["again", "Errei"],
  ["hard", "Dúvida"],
  ["good", "Bom"],
  ["easy", "Fácil"],
];

export function StudyCard({
  card,
  flipped,
  reviewing,
  onFlip,
  onReview,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {card.topic ? <p className="text-sm text-muted">{card.topic}</p> : null}

      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        className="min-h-48 border border-line bg-panel px-5 py-5 text-left transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          {flipped ? "Resposta" : "Pergunta"}
        </p>
        <p
          key={flipped ? "back" : "front"}
          className="study-card-face text-lg leading-relaxed whitespace-pre-wrap text-ink"
        >
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-4 text-sm text-muted">
          {flipped ? "Clique para ver a pergunta" : "Clique para revelar"}
        </p>
      </button>

      {card.tags?.length ? (
        <p className="text-sm text-muted">{card.tags.join(" · ")}</p>
      ) : null}

      {flipped ? (
        <div className="grid grid-cols-4 gap-2" aria-label="Avaliar lembrança">
          {ratings.map(([rating, label]) => (
            <button
              key={rating}
              type="button"
              disabled={reviewing}
              onClick={() => onReview(rating)}
              className="border border-line bg-panel px-2 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Revele a resposta para avaliar.</p>
      )}
    </div>
  );
}
