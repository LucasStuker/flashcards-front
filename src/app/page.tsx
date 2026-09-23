"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Deck, listDecks, uploadPdf } from "../lib/api";

function statusLabel(status: Deck["status"]) {
  if (status === "ready") return "Pronto";
  if (status === "processing") return "Gerando cards…";
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

  const hasProcessing = decks.some((d) => d.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [hasProcessing, refresh]);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Envie um arquivo PDF.");
      return;
    }
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
    <AppShell>
      <header className="flex max-w-2xl flex-col gap-2">
        <h1
          className="text-3xl tracking-tight text-ink md:text-4xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Seus decks
        </h1>
        <p className="text-muted">
          Envie um PDF. A Yorkstudy gera os cards e você revisa com repetição
          espaçada.
        </p>
      </header>

      <section
        aria-labelledby="upload-heading"
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
        className={`border border-dashed px-6 py-10 transition duration-200 ${
          dragOver
            ? "border-accent bg-panel"
            : uploading
              ? "border-accent/50 bg-panel"
              : "border-line bg-panel/70"
        }`}
      >
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              id="upload-heading"
              className="text-xl text-ink"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Envie um PDF
            </h2>
            <p className="mt-1 text-sm text-muted">
              Arraste o arquivo aqui ou selecione no computador (máx. 40 MB).
            </p>
            {uploading ? (
              <p className="mt-3 text-sm font-medium text-accent" aria-live="polite">
                Enviando PDF…
              </p>
            ) : null}
          </div>
          <label
            htmlFor="pdf-upload"
            className={`inline-flex cursor-pointer bg-accent px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-accent-deep focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
              uploading ? "pointer-events-none opacity-70" : ""
            }`}
          >
            {uploading ? "Enviando…" : "Selecionar PDF"}
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void handleFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad"
        >
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="decks-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="decks-heading"
              className="text-2xl text-ink"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Seus decks
            </h2>
            {hasProcessing ? (
              <p className="mt-1 text-sm text-warn" aria-live="polite">
                Gerando cards — atualizando a cada 2s…
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm font-medium text-accent transition hover:text-accent-deep"
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted" aria-live="polite">
            Carregando decks…
          </p>
        ) : decks.length === 0 ? (
          <p className="border border-line bg-panel px-5 py-8 text-sm text-muted">
            Nenhum deck ainda. Envie um PDF para começar.
          </p>
        ) : (
          <ul className="grid gap-3">
            {decks.map((deck) => (
              <li
                key={deck._id}
                className="border border-line bg-panel px-5 py-4 transition duration-200 hover:border-accent/40"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-ink">
                      {deck.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {deck.subject ? `${deck.subject} · ` : ""}
                      {deck.cardCount} cards ·{" "}
                      <span className={`font-medium ${statusClass(deck.status)}`}>
                        {statusLabel(deck.status)}
                      </span>
                      {deck.generationMethod
                        ? ` · ${deck.generationMethod === "openai" ? "IA OpenAI" : "heurística"}`
                        : ""}
                    </p>
                    {deck.generationNote ? (
                      <p className="mt-1 text-sm text-muted">{deck.generationNote}</p>
                    ) : null}
                    {deck.errorMessage ? (
                      <p className="mt-1 text-sm text-bad">{deck.errorMessage}</p>
                    ) : null}
                  </div>
                  {deck.status === "ready" ? (
                    <Link
                      href={`/decks/${deck._id}`}
                      className="inline-flex shrink-0 bg-accent px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-accent-deep"
                    >
                      Estudar
                    </Link>
                  ) : deck.status === "processing" ? (
                    <span className="text-sm font-medium text-warn">Aguarde…</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
