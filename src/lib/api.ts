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
  disciplina?: string;
  generationMethod?: "openai" | "heuristic";
  generationNote?: string;
  newCount?: number;
  learnCount?: number;
  dueCount?: number;
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
  state?: "new" | "learning" | "review" | "relearning";
  suspended?: boolean;
  reps?: number;
  lapses?: number;
  scheduled?: Scheduled;
};

export type Scheduled = {
  again: string;
  hard: string;
  good: string;
  easy: string;
};

export type StudyScope = "all" | "day";

export type StudyQueue = {
  cards: Flashcard[];
  counts: { new: number; learn: number; due: number };
  nextDueAt: string | null;
};

export type Stats = {
  reviewsToday: number;
  correct: number;
  total: number;
  retention: number | null;
  streak: number;
  forecast: { date: string; count: number }[];
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function errorMessage(status: number, text: string) {
  try {
    const body = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string" && body.message) return body.message;
  } catch {
    // corpo em texto puro
  }
  return text || `Erro ${status}`;
}

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
    throw new ApiError(res.status, errorMessage(res.status, text));
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

export function getFlashcards(deckId: string, q?: string) {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return request<Flashcard[]>(`/decks/${deckId}/flashcards${query}`);
}

export function getStudy(deckId: string, scope: StudyScope = "all") {
  const query = scope === "day" ? "?scope=day" : "";
  return request<StudyQueue>(`/decks/${deckId}/study${query}`);
}

export function deleteDeck(id: string) {
  return request<void>(`/decks/${id}`, { method: "DELETE" });
}

export function updateDeck(id: string, data: { title?: string; disciplina?: string }) {
  return request<Deck>(`/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function renameDeck(id: string, title: string) {
  return updateDeck(id, { title });
}

export function createCard(deckId: string, front: string, back: string) {
  return request<Flashcard>(`/decks/${deckId}/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ front, back }),
  });
}

export function deleteCard(id: string) {
  return request<void>(`/flashcards/${id}`, { method: "DELETE" });
}

export function updateCard(
  id: string,
  data: { front?: string; back?: string; suspended?: boolean },
) {
  return request<Flashcard>(`/flashcards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function undoReview() {
  return request<Flashcard>("/flashcards/undo", { method: "POST" });
}

export function getStats() {
  return request<Stats>("/stats");
}

export async function uploadPdf(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<Deck>("/decks/upload", {
    method: "POST",
    body: form,
  });
}

export type AssuntoEdital = {
  id: number;
  nome: string;
  teoria: number;
  revisao: number;
  questoes: number;
  horas: number;
};

export type DisciplinaEdital = {
  id: number;
  nome: string;
  assuntos: AssuntoEdital[];
};

export type EditalResumo = {
  id: number;
  cargo: string;
  status: "publicado";
  banca: { id: number; nome: string };
};

export type Edital = EditalResumo & {
  disciplinas: DisciplinaEdital[];
};

export function listEditais() {
  return request<EditalResumo[]>("/editais");
}

export function getEdital(id: number) {
  return request<Edital>(`/editais/${id}`);
}

export function uploadEditalCsv(arquivo: File, banca: string, cargo: string) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("banca", banca);
  form.append("cargo", cargo);
  return request<Edital>("/editais/csv", {
    method: "POST",
    body: form,
  });
}

export type DisciplinaResumo = {
  id: number;
  nome: string;
  topicos: number;
};

export type Topico = {
  id: number;
  nome: string;
  filhos: Topico[];
};

export type Disciplina = {
  id: number;
  nome: string;
  topicos: Topico[];
};

export function listDisciplinas() {
  return request<DisciplinaResumo[]>("/disciplinas");
}

export function getDisciplina(id: number) {
  return request<Disciplina>(`/disciplinas/${id}`);
}

export async function listDisciplinasDosEditais() {
  const editais = await listEditais();
  const detalhes = await Promise.all(editais.map((edital) => getEdital(edital.id)));
  const nomes = new Set<string>();
  for (const edital of detalhes) {
    for (const disciplina of edital.disciplinas) nomes.add(disciplina.nome);
  }
  return [...nomes];
}

export type Dashboard = {
  resumo: {
    semana: { atualSegundos: number; anteriorSegundos: number };
    acertos: { dias: number; total: number; corretas: number; taxa: number | null };
    sequencia: number;
    revisoesHoje: { topicos: number; cards: number };
  };
};

export function getDashboard() {
  return request<Dashboard>("/dashboard");
}

export type SemanaDesempenho = { numero: number; inicio: string; fim: string };

export type DesempenhoSemana = {
  semana: SemanaDesempenho;
  dias: {
    dia: string;
    segundos: number;
    questoes: number;
    corretas: number;
    taxa: number | null;
    futuro: boolean;
  }[];
  totais: { segundos: number; questoes: number; corretas: number; taxa: number | null };
  semanas: SemanaDesempenho[];
};

export type PeriodoDesempenho = 7 | 30 | 90;

export type DesempenhoDisciplina = {
  disciplina: string;
  segundos: number;
  questoes: number;
  corretas: number;
  naoAcertou: number;
  taxa: number | null;
  participacaoTempo: number;
  participacaoQuestoes: number;
  poucosDados: boolean;
};

export type DesempenhoDisciplinas = {
  periodo: { dias: PeriodoDesempenho; inicio: string; fim: string };
  disciplinas: DesempenhoDisciplina[];
  totais: { segundos: number; questoes: number; corretas: number; taxa: number | null };
};

export function getDesempenhoSemana(dia?: string) {
  const query = dia ? `?dia=${encodeURIComponent(dia)}` : "";
  return request<DesempenhoSemana>(`/desempenho/semana${query}`);
}

export function getDesempenhoDisciplinas(dias: PeriodoDesempenho) {
  return request<DesempenhoDisciplinas>(`/desempenho/disciplinas?dias=${dias}`);
}

export type Sessao = {
  id: string;
  disciplina: string;
  editalId: number | null;
  linhaId: number | null;
  status: "aberta" | "concluida";
  iniciadaEm: string;
  rodandoDesde: string | null;
  liquidoSegundos: number;
  questoes: number;
  acertos: number;
};

export function iniciarSessao(data: { disciplina: string; editalId?: number; linhaId?: number }) {
  return request<Sessao>("/sessoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function pausarSessao(id: string) {
  return request<Sessao>(`/sessoes/${id}/pausar`, { method: "POST" });
}

export function retomarSessao(id: string) {
  return request<Sessao>(`/sessoes/${id}/retomar`, { method: "POST" });
}

export function concluirSessao(id: string, data: { questoes: number; acertos: number }) {
  return request<Sessao>(`/sessoes/${id}/concluir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function descartarSessao(id: string) {
  return request<void>(`/sessoes/${id}`, { method: "DELETE" });
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

export function updateMe(nome: string) {
  return request<AuthUser>("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
}

export function changeOwnPassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean }>("/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
