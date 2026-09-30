import { AuthUser, clearSession, getToken, setSession } from "./auth";

export type DeckStatus = "processing" | "ready" | "error";

export type Deck = {
  _id: string;
  ownerId?: string;
  title: string;
  sourceFilename: string;
  status: DeckStatus;
  cardCount: number;
  errorMessage?: string;
  subject?: string;
  generationMethod?: "openai" | "heuristic";
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

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  setSession(data.accessToken, data.user);
  return data;
}

export function me() {
  return request<AuthUser>("/auth/me");
}

export function listDecks() {
  return request<Deck[]>("/decks");
}

export function getDeck(id: string) {
  return request<Deck>(`/decks/${id}`);
}

export function getFlashcards(deckId: string) {
  return request<Flashcard[]>(`/decks/${deckId}/flashcards`);
}

export async function uploadPdf(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<Deck>("/decks/upload", {
    method: "POST",
    body: form,
  });
}

export type ReviewRating = "again" | "hard" | "good" | "easy";
export type ReviewOutcome = "correct" | "wrong" | "unsure";

export type HistoryItem = {
  _id: string;
  outcome: ReviewOutcome;
  rating: ReviewRating;
  createdAt: string;
  deck: { _id: string; title: string } | null;
  card: {
    _id: string;
    front: string;
    back: string;
    topic?: string;
    tags: string[];
  } | null;
};

export type HistoryResponse = {
  summary: {
    total: number;
    correct: number;
    wrong: number;
    unsure: number;
  };
  hasMore: boolean;
  items: HistoryItem[];
};

export function reviewCard(id: string, rating: ReviewRating) {
  return request<Flashcard>(`/flashcards/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  });
}

export function getHistory(outcome?: ReviewOutcome) {
  const query = outcome ? `?outcome=${outcome}` : "";
  return request<HistoryResponse>(`/history${query}`);
}

export function listUsers() {
  return request<AuthUser[]>("/users");
}

export function createAdmin(email: string, password: string) {
  return request<AuthUser>("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function updateUser(
  id: string,
  data: { active?: boolean; password?: string },
) {
  return request<AuthUser>(`/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function changeOwnPassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean }>("/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
