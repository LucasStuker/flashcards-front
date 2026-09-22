"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Deck, listDecks, uploadPdf } from "../lib/api";

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

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listDecks();
      setDecks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar decks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const hasProcessing = decks.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [decks, refresh]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadPdf(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
          DataPrev 2026
        </p>
        <h1
          className="max-w-2xl text-4xl leading-tight text-ink md:text-5xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Flashcards a partir do PDF do Estratégia
        </h1>
        <p className="max-w-xl text-base text-muted">
          Envie uma aula em PDF. O sistema extrai o texto, gera cards e você
          estuda com repetição espaçada simples.
        </p>
      </header>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`border border-dashed px-6 py-10 transition ${
          dragOver ? "border-accent bg-panel" : "border-line bg-panel/70"
        }`}
      >
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-xl text-ink"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Upload do PDF
            </h2>
            <p className="mt-1 text-sm text-muted">
              Arraste o arquivo ou escolha no computador (máx. 40 MB).
            </p>
          </div>
          <label className="cursor-pointer bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep">
            {uploading ? "Enviando…" : "Selecionar PDF"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2
            className="text-2xl text-ink"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Seus decks
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm font-medium text-accent hover:text-accent-deep"
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : decks.length === 0 ? (
          <p className="border border-line bg-panel px-4 py-6 text-sm text-muted">
            Nenhum deck ainda. Envie o PDF da Aula 00 para começar.
          </p>
        ) : (
          <ul className="grid gap-3">
            {decks.map((deck) => (
              <li
                key={deck._id}
                className="border border-line bg-panel px-5 py-4 transition hover:border-accent/40"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-ink">
                      {deck.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {deck.subject ? `${deck.subject} · ` : ""}
                      {deck.cardCount} cards ·{" "}
                      <span className={statusClass(deck.status)}>
                        {statusLabel(deck.status)}
                      </span>
                      {deck.generationMethod
                        ? ` · ${deck.generationMethod === "openai" ? "IA OpenAI" : "heurística"}`
                        : ""}
                      {deck.generationNote ? ` — ${deck.generationNote}` : ""}
                      {deck.errorMessage ? ` — ${deck.errorMessage}` : ""}
                    </p>
                  </div>
                  {deck.status === "ready" ? (
                    <Link
                      href={`/decks/${deck._id}`}
                      className="inline-flex bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
                    >
                      Estudar
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
