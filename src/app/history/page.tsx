"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../../components/AppShell";
import {
  getHistory,
  HistoryItem,
  HistoryResponse,
  ReviewOutcome,
} from "../../lib/api";

type Filter = "all" | ReviewOutcome;

const filters: { id: Filter; label: string; countKey: keyof HistoryResponse["summary"] }[] =
  [
    { id: "all", label: "Feitas", countKey: "total" },
    { id: "correct", label: "Acertou", countKey: "correct" },
    { id: "wrong", label: "Errou", countKey: "wrong" },
    { id: "unsure", label: "Dúvida", countKey: "unsure" },
  ];

function outcomeLabel(outcome: ReviewOutcome) {
  if (outcome === "correct") return "Acertou";
  if (outcome === "wrong") return "Errou";
  return "Dúvida";
}

function outcomeClass(outcome: ReviewOutcome) {
  if (outcome === "correct") return "text-ok";
  if (outcome === "wrong") return "text-bad";
  return "text-warn";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (next: Filter) => {
    const id = ++requestId.current;
    try {
      const data = await getHistory(next === "all" ? undefined : next);
      if (id !== requestId.current) return;
      setHistory(data);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Falha ao carregar histórico");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  function onFilter(next: Filter) {
    if (next === filter) return;
    setOpenId(null);
    setFilter(next);
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1
          className="text-xl text-ink"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Histórico
        </h1>
        <div className="flex flex-wrap gap-1 text-sm" aria-label="Filtrar histórico">
          {filters.map((item) => {
            const selected = filter === item.id;
            const count = history?.summary[item.countKey] ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onFilter(item.id)}
                className={`px-2 py-1 ${
                  selected
                    ? "bg-accent text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}{" "}
                <span className="tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {loading && !history ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando histórico…
        </p>
      ) : history && history.summary.total === 0 ? (
        <p className="border border-line bg-panel px-4 py-5 text-sm text-muted">
          Nenhuma ficha avaliada ainda. Estude um deck e escolha Errei, Dúvida, Bom
          ou Fácil.
        </p>
      ) : history && history.items.length === 0 ? (
        <p className="border border-line bg-panel px-5 py-8 text-sm text-muted">
          Nenhuma ficha nesta categoria.
        </p>
      ) : (
        <ul className="grid gap-3">
          {history?.items.map((item) => (
            <li key={item._id}>
              <HistoryFicha
                item={item}
                open={openId === item._id}
                onToggle={() =>
                  setOpenId((current) => (current === item._id ? null : item._id))
                }
              />
            </li>
          ))}
        </ul>
      )}

      {history?.hasMore ? (
        <p className="text-sm text-muted">
          Mostrando as 200 fichas mais recentes deste filtro.
        </p>
      ) : null}
    </AppShell>
  );
}

function HistoryFicha({
  item,
  open,
  onToggle,
}: {
  item: HistoryItem;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = `${item.deck?.title ?? "Deck"} · ${formatWhen(item.createdAt)}`;

  if (!item.card) {
    return (
      <div className="border border-line bg-panel px-5 py-4">
        <p className={`text-xs font-semibold tracking-[0.14em] uppercase ${outcomeClass(item.outcome)}`}>
          {outcomeLabel(item.outcome)}
        </p>
        <p className="mt-2 text-sm text-muted">Esta ficha não está mais disponível.</p>
        <p className="mt-2 text-sm text-muted">{meta}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className="w-full border border-line bg-panel px-4 py-3 text-left transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <p className={`text-xs font-semibold tracking-[0.14em] uppercase ${outcomeClass(item.outcome)}`}>
        {open ? "Resposta" : "Pergunta"} · {outcomeLabel(item.outcome)}
      </p>
      <p
        key={open ? "back" : "front"}
        className="study-card-face mt-2 text-lg leading-relaxed whitespace-pre-wrap text-ink"
      >
        {open ? item.card.back : item.card.front}
      </p>
      {item.card.topic ? (
        <p className="mt-2 text-sm text-muted">{item.card.topic}</p>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        {meta} · {open ? "Toque para ver a pergunta" : "Toque para ver a resposta"}
      </p>
    </button>
  );
}
