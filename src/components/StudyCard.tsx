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

const ratings: Array<[Rating, string, string, string]> = [
  ["again", "Errei", "A", "text-bad"],
  ["hard", "Dúvida", "S", "text-warn"],
  ["good", "Bom", "W", "text-ink"],
  ["easy", "Fácil", "D", "text-accent"],
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
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        className="min-h-44 border border-line bg-panel px-4 py-4 text-left transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:border-accent sm:min-h-56 sm:px-5 sm:py-5"
      >
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          {flipped ? "Resposta" : "Pergunta"}
        </p>
        <p
          key={flipped ? "back" : "front"}
          className="study-card-face text-base leading-relaxed whitespace-pre-wrap text-ink sm:text-lg"
        >
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-4 text-sm text-muted">
          {flipped ? (
            <>
              <span className="sm:hidden">Toque para ver a pergunta</span>
              <span className="hidden sm:inline">Clique para ver a pergunta</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">Toque para revelar</span>
              <span className="hidden sm:inline">Clique para revelar</span>
            </>
          )}
        </p>
      </button>

      {card.tags?.length ? (
        <p className="text-sm text-muted">{card.tags.join(" · ")}</p>
      ) : null}

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Avaliar lembrança">
          {ratings.map(([rating, label, key, tone]) => {
            const interval = card.scheduled?.[rating];
            return (
              <button
                key={rating}
                type="button"
                disabled={reviewing}
                aria-keyshortcuts={key}
                aria-label={
                  interval ? `${label}, atalho ${key}, ${interval}` : `${label}, atalho ${key}`
                }
                onClick={() => onReview(rating)}
                className={`flex min-h-14 flex-col items-center justify-center border border-line bg-panel px-2 py-2 text-sm font-semibold transition hover:border-accent disabled:opacity-60 ${tone}`}
              >
                {label}
                <span className="mt-0.5 text-[11px] font-medium text-muted">
                  <span className="hidden sm:inline">{key}</span>
                  {interval ? (
                    <>
                      <span className="hidden sm:inline"> · </span>
                      {interval}
                    </>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">Revele a resposta para avaliar.</p>
      )}
    </div>
  );
}
