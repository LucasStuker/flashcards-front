"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { DeckList } from "../components/DeckList";
import { ImportDeck } from "../components/ImportDeck";
import { Deck, listDecks, uploadPdf } from "../lib/api";

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <AppShell
      action={<ImportDeck onFile={handleFile} uploading={uploading} />}
    >
      {error ? (
        <p
          role="alert"
          className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad"
        >
          {error}
        </p>
      ) : null}

      <DeckList
        decks={decks}
        loading={loading}
        hasProcessing={hasProcessing}
        empty={
          <ImportDeck
            variant="dropzone"
            onFile={handleFile}
            uploading={uploading}
          />
        }
      />
    </AppShell>
  );
}
