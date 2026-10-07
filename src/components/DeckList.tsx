"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { Deck } from "../lib/api";

type Props = {
  decks: Deck[];
  loading: boolean;
  hasProcessing: boolean;
  empty: ReactNode;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

function StudyLink({ deck, className = "" }: { deck: Deck; className?: string }) {
  if (deck.status === "ready") {
    return (
      <Link
        href={`/decks/${deck._id}`}
        className={`inline-flex bg-accent px-2.5 py-2 text-xs font-semibold text-white hover:bg-accent-deep md:py-1 ${className}`}
      >
        Estudar
      </Link>
    );
  }
  if (deck.status === "processing") {
    return <span className={`text-xs text-warn ${className}`}>Aguarde</span>;
  }
  return (
    <Link
      href={`/decks/${deck._id}`}
      className={`text-xs font-semibold text-ink hover:text-accent ${className}`}
    >
      Abrir
    </Link>
  );
}

export function DeckList({
  decks,
  loading,
  hasProcessing,
  empty,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        Carregando decks…
      </p>
    );
  }

  if (decks.length === 0) return <>{empty}</>;

  function startRename(deck: Deck) {
    setEditingId(deck._id);
    setDraft(deck.title);
    setConfirmingDelete(null);
    setRowError(null);
  }

  async function saveRename(event: FormEvent) {
    event.preventDefault();
    if (!editingId || saving) return;
    setSaving(true);
    setRowError(null);
    try {
      await onRename(editingId, draft);
      setEditingId(null);
    } catch (err) {
      setRowError({
        id: editingId,
        message: err instanceof Error ? err.message : "Falha ao renomear",
      });
    } finally {
      setSaving(false);
    }
  }

  function remove(id: string) {
    setDeleting(true);
    setRowError(null);
    void onDelete(id)
      .catch((err: unknown) => {
        setRowError({
          id,
          message: err instanceof Error ? err.message : "Falha ao excluir",
        });
      })
      .finally(() => {
        setDeleting(false);
        setConfirmingDelete(null);
      });
  }

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

      <div className="border border-line bg-panel">
        <div className="hidden border-b border-line text-xs text-muted md:grid md:grid-cols-[minmax(0,1fr)_3.5rem_5rem_4rem_5rem_6rem] md:px-3 md:py-2">
          <span className="font-medium">Nome</span>
          <span className="text-right font-medium">Novos</span>
          <span className="text-right font-medium">Aprender</span>
          <span className="text-right font-medium">Revisar</span>
          <span className="pl-2 font-medium">Status</span>
          <span className="sr-only">Estudar</span>
        </div>
        <ul>
          {decks.map((deck) => {
            const locked = deck.status === "processing";
            const editing = editingId === deck._id;
            const error = rowError?.id === deck._id ? rowError.message : null;
            return (
              <li
                key={deck._id}
                className="grid grid-cols-1 gap-2 border-b border-line/70 px-3 py-3 last:border-0 md:grid-cols-[minmax(0,1fr)_3.5rem_5rem_4rem_5rem_6rem] md:items-start md:gap-x-2 md:py-2"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  {editing ? (
                    <form onSubmit={(event) => void saveRename(event)} className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`rename-${deck._id}`}>
                        Nome do deck
                      </label>
                      <input
                        id={`rename-${deck._id}`}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        maxLength={120}
                        autoFocus
                        className="min-w-0 flex-1 border border-line bg-paper px-2 py-1 text-sm text-ink"
                      />
                      <button
                        type="submit"
                        disabled={saving || draft.trim().length === 0}
                        className="bg-accent px-2 py-1 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
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
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium break-words text-ink">{deck.title}</p>
                      <span className={`shrink-0 text-xs font-medium md:hidden ${statusClass(deck.status)}`}>
                        {statusLabel(deck.status)}
                      </span>
                    </div>
                  )}
                  {deck.generationNote ? (
                    <p className="text-xs text-muted">{deck.generationNote}</p>
                  ) : null}
                  {deck.errorMessage ? (
                    <p className="text-xs text-bad">{deck.errorMessage}</p>
                  ) : null}
                  <p className="text-xs tabular-nums text-muted md:hidden">
                    Novos {deck.newCount ?? 0}
                    <span aria-hidden="true"> · </span>
                    Aprender {deck.learnCount ?? 0}
                    <span aria-hidden="true"> · </span>
                    Revisar {deck.dueCount ?? 0}
                  </p>
                  {error ? (
                    <p role="alert" className="text-xs text-bad">
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        type="button"
                        disabled={locked || editing}
                        onClick={() => startRename(deck)}
                        className="py-1 text-xs font-medium text-muted hover:text-ink disabled:opacity-40"
                      >
                        Renomear
                      </button>
                      {deck.status !== "processing" ? (
                        <Link
                          href={`/decks/${deck._id}/cards`}
                          className="py-1 text-xs font-medium text-muted hover:text-ink"
                        >
                          Cards
                        </Link>
                      ) : null}
                      {confirmingDelete === deck._id ? (
                        <>
                          <button
                            type="button"
                            disabled={deleting || locked}
                            onClick={() => remove(deck._id)}
                            className="py-1 text-xs font-semibold text-bad disabled:opacity-60"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(null)}
                            className="py-1 text-xs text-muted hover:text-ink"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmingDelete(deck._id);
                            setRowError(null);
                          }}
                          className="py-1 text-xs font-medium text-muted hover:text-bad"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                    <StudyLink deck={deck} className="md:hidden" />
                  </div>
                </div>
                <span className="hidden pt-0.5 text-right text-sm tabular-nums text-muted md:block">
                  <span className="sr-only">Novos </span>
                  {deck.newCount ?? 0}
                </span>
                <span className="hidden pt-0.5 text-right text-sm tabular-nums text-muted md:block">
                  <span className="sr-only">Aprender </span>
                  {deck.learnCount ?? 0}
                </span>
                <span className="hidden pt-0.5 text-right text-sm tabular-nums text-muted md:block">
                  <span className="sr-only">Revisar </span>
                  {deck.dueCount ?? 0}
                </span>
                <span className={`hidden pt-0.5 pl-2 text-sm font-medium md:block ${statusClass(deck.status)}`}>
                  {statusLabel(deck.status)}
                </span>
                <span className="hidden text-right md:block">
                  <StudyLink deck={deck} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
