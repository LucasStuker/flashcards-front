"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { DeckList } from "@/components/DeckList";
import { ImportDeck } from "@/components/ImportDeck";
import {
  Deck,
  deleteDeck,
  listDecks,
  listDisciplinasDosEditais,
  updateDeck,
  uploadPdf,
} from "@/lib/api";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
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

  useEffect(() => {
    let active = true;
    void listDisciplinasDosEditais()
      .then((nomes) => {
        if (active) setDisciplinas(nomes);
      })
      .catch(() => {
        // Sem catálogo, a disciplina continua em texto livre.
      });
    return () => {
      active = false;
    };
  }, []);

  const hasProcessing = decks.some((d) => d.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [hasProcessing, refresh]);

  async function handleDelete(id: string) {
    await deleteDeck(id);
    setDecks((prev) => prev.filter((deck) => deck._id !== id));
  }

  async function handleSave(id: string, data: { title: string; disciplina: string }) {
    const updated = await updateDeck(id, data);
    setDecks((prev) =>
      prev.map((deck) =>
        deck._id === id
          ? {
              ...deck,
              ...updated,
              disciplina: updated.disciplina,
              newCount: updated.newCount ?? deck.newCount,
              learnCount: updated.learnCount ?? deck.learnCount,
              dueCount: updated.dueCount ?? deck.dueCount,
            }
          : deck,
      ),
    );
  }

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
    <PageContainer action={<ImportDeck onFile={handleFile} uploading={uploading} />}>
      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      <DeckList
        decks={decks}
        loading={loading}
        hasProcessing={hasProcessing}
        disciplinas={disciplinas}
        onSave={handleSave}
        onDelete={handleDelete}
        empty={
          <ImportDeck variant="dropzone" onFile={handleFile} uploading={uploading} />
        }
      />
    </PageContainer>
  );
}
