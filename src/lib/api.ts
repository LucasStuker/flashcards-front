export type DeckStatus = 'processing' | 'ready' | 'error';

export type Deck = {
  _id: string;
  title: string;
  sourceFilename: string;
  status: DeckStatus;
  cardCount: number;
  errorMessage?: string;
  subject?: string;
  generationMethod?: 'openai' | 'heuristic';
  generationNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Flashcard = {
  _id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  topic?: string;
  dueAt?: string;
  intervalDays?: number;
  ease?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function listDecks() {
  return request<Deck[]>('/decks');
}

export function getDeck(id: string) {
  return request<Deck>(`/decks/${id}`);
}

export function getFlashcards(deckId: string) {
  return request<Flashcard[]>(`/decks/${deckId}/flashcards`);
}

export async function uploadPdf(file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<Deck>('/decks/upload', {
    method: 'POST',
    body: form,
  });
}

export function reviewCard(id: string, rating: 'again' | 'hard' | 'good' | 'easy') {
  return request<Flashcard>(`/flashcards/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
}
