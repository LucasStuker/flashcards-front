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
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
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

export type EditalOficialResumo = {
  id: number;
  orgao: string;
  cargo: string;
  area: string | null;
  banca: string;
  ano: number;
  inscrito: boolean;
  disciplinas: number;
  topicos: number;
};

export type EditalOficial = Omit<EditalOficialResumo, "disciplinas" | "topicos"> & {
  disciplinas: Disciplina[];
};

export function listEditaisOficiais() {
  return request<EditalOficialResumo[]>("/editais-oficiais");
}

export function getEditalOficial(id: number) {
  return request<EditalOficial>(`/editais-oficiais/${id}`);
}

export function inscreverEdital(id: number) {
  return request<EditalOficial>(`/editais-oficiais/${id}/inscricao`, { method: "POST" });
}

export function cancelarInscricaoEdital(id: number) {
  return request<void>(`/editais-oficiais/${id}/inscricao`, { method: "DELETE" });
}

export type ProgressoTopico = {
  teoriaEm: string | null;
  revisao1Em: string | null;
  revisao2Em: string | null;
  revisao3Em: string | null;
  questoes: number;
  acertos: number;
};

export type ResumoProgresso = {
  topicos: number;
  teoria: number;
  revisados: number;
  questoes: number;
  acertos: number;
  taxa: number | null;
};

export type TopicoVerticalizado = {
  id: number;
  nome: string;
  /** `null` em tópico com subtópicos: o progresso fica nas folhas. */
  progresso: ProgressoTopico | null;
  resumo: ResumoProgresso;
  filhos: TopicoVerticalizado[];
};

export type Verticalizado = Omit<EditalOficialResumo, "disciplinas" | "topicos"> & {
  resumo: ResumoProgresso;
  disciplinas: { id: number; nome: string; resumo: ResumoProgresso; topicos: TopicoVerticalizado[] }[];
};

export function getVerticalizado(editalId: number) {
  return request<Verticalizado>(`/editais-oficiais/${editalId}/verticalizado`);
}

export function salvarProgressoTopico(editalId: number, topicoId: number, progresso: ProgressoTopico) {
  return request<Verticalizado>(`/editais-oficiais/${editalId}/verticalizado/topicos/${topicoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progresso),
  });
}

export async function listDisciplinasDosEditais() {
  const editais = (await listEditaisOficiais()).filter((edital) => edital.inscrito);
  const detalhes = await Promise.all(editais.map((edital) => getEditalOficial(edital.id)));
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

export type CorMateria = 1 | 2 | 3 | 4 | 5 | 6;

export type MateriaCronograma = {
  id: string;
  nome: string;
  cor: CorMateria;
};

export type ModoSessao = "teoria" | "questoes" | "revisao" | "misto";

export type BlocoEstudo = {
  id: string;
  materiaId: string;
  dia: string;
  inicioMin: number;
  fimMin: number;
  modo: ModoSessao;
};

export type NovoBloco = Omit<BlocoEstudo, "id">;

export type SlotLivre = {
  weekday: number;
  inicioMin: number;
  fimMin: number;
};

export function getDisponibilidadeCronograma() {
  return request<{ slots: SlotLivre[] }>("/cronograma/disponibilidade");
}

export function salvarDisponibilidadeCronograma(slots: SlotLivre[]) {
  return request<{ slots: SlotLivre[] }>("/cronograma/disponibilidade", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slots }),
  });
}

export function listMateriasCronograma(editalId?: number) {
  const q = editalId != null ? `?editalId=${editalId}` : "";
  return request<MateriaCronograma[]>(`/cronograma/materias${q}`);
}

export function listBlocosCronograma(inicio: string, fim: string) {
  return request<BlocoEstudo[]>(
    `/cronograma/blocos?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`,
  );
}

export function criarBlocoCronograma(novo: NovoBloco) {
  return request<BlocoEstudo>("/cronograma/blocos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novo),
  });
}

export function atualizarBlocoCronograma(id: string, mudancas: Partial<NovoBloco>) {
  return request<BlocoEstudo>(`/cronograma/blocos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mudancas),
  });
}

export function removerBlocoCronograma(id: string) {
  return request<{ ok: true }>(`/cronograma/blocos/${id}`, { method: "DELETE" });
}

export function gerarCronogramaSemana(segunda: string, editalId?: number) {
  return request<{
    materias: MateriaCronograma[];
    blocos: BlocoEstudo[];
    semanaPlano?: { titulo: string; resumo: string; fase: string } | null;
  }>("/cronograma/gerar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segunda, ...(editalId != null ? { editalId } : {}) }),
  });
}

export type SemanaPlanoCronograma = {
  indice: number;
  segunda: string;
  fase: "base" | "intensivo" | "revisao";
  titulo: string;
  resumo: string;
  pesos: Record<string, number>;
};

export type PlanoCronograma = {
  id: string;
  editalId: number;
  dataProva: string | null;
  segundaInicio: string;
  justificativa: string;
  metodo: "openai" | "heuristic";
  generationNote: string | null;
  semanas: SemanaPlanoCronograma[];
};

export type NivelDominio = "fraco" | "ok" | "forte";
export type FocoEstudo = "teoria" | "questoes" | "revisao";

export type ItemAutoavaliacao = {
  materiaId: string;
  dominio: NivelDominio;
  foco?: FocoEstudo;
};

export function getAutoavaliacaoCronograma(editalId?: number) {
  const q = editalId != null ? `?editalId=${editalId}` : "";
  return request<{ editalId: number; itens: ItemAutoavaliacao[] }>(
    `/cronograma/autoavaliacao${q}`,
  );
}

export function salvarAutoavaliacaoCronograma(
  editalId: number,
  itens: ItemAutoavaliacao[],
) {
  return request<{ editalId: number; itens: ItemAutoavaliacao[] }>(
    "/cronograma/autoavaliacao",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editalId, itens }),
    },
  );
}

export function getPlanoCronograma() {
  return request<PlanoCronograma | null>("/cronograma/plano");
}

export function criarPlanoCronograma(data: {
  editalId?: number;
  dataProva?: string | null;
  segunda?: string;
}) {
  return request<{
    plano: PlanoCronograma;
    materias: MateriaCronograma[];
    blocos: BlocoEstudo[];
  }>("/cronograma/plano", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export type Sessao = {
  id: string;
  disciplina: string;
  editalId: number | null;
  topicoId: number | null;
  status: "aberta" | "concluida";
  iniciadaEm: string;
  rodandoDesde: string | null;
  liquidoSegundos: number;
  questoes: number;
  acertos: number;
};

export function sessaoAberta() {
  return request<Sessao | null>("/sessoes/aberta");
}

export function iniciarSessao(data: {
  disciplina: string;
  editalId?: number;
  topicoId?: number;
}) {
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
