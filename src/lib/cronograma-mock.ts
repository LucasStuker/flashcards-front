/**
 * Cronograma com dados de exemplo, salvos no localStorage deste navegador.
 * As funções têm a assinatura que a API terá; quando o endpoint existir, elas
 * passam para `api.ts` e as telas não mudam.
 */

export type CorMateria = 1 | 2 | 3 | 4 | 5 | 6;

export type Materia = {
  id: string;
  nome: string;
  cor: CorMateria;
};

/** `dia` em `YYYY-MM-DD` local; início e fim em minutos desde 00:00. */
export type BlocoEstudo = {
  id: string;
  materiaId: string;
  dia: string;
  inicioMin: number;
  fimMin: number;
};

export type NovoBloco = Omit<BlocoEstudo, "id">;

const CHAVE = "yorkstudy:cronograma:v1";

const materiasExemplo: Materia[] = [
  { id: "programacao", nome: "Programação", cor: 1 },
  { id: "informatica", nome: "Informática", cor: 2 },
  { id: "direito-constitucional", nome: "Direito Constitucional", cor: 3 },
  { id: "portugues", nome: "Língua Portuguesa", cor: 4 },
  { id: "analise-dados", nome: "Análise de Dados", cor: 5 },
  { id: "raciocinio-logico", nome: "Raciocínio Lógico", cor: 6 },
  { id: "engenharia-software", nome: "Engenharia de Software", cor: 2 },
  { id: "direito-administrativo", nome: "Direito Administrativo", cor: 3 },
];

type Estado = { blocos: BlocoEstudo[] };

function diaLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function h(hora: number, minuto = 0) {
  return hora * 60 + minuto;
}

function blocosExemplo(): BlocoEstudo[] {
  const hoje = new Date();
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const dia = (deslocamento: number) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + deslocamento);
    return diaLocal(data);
  };
  const plano: [number, string, number, number][] = [
    [0, "programacao", h(8), h(10)],
    [0, "portugues", h(19), h(20, 30)],
    [1, "analise-dados", h(8), h(9, 30)],
    [1, "direito-constitucional", h(14), h(16)],
    [2, "informatica", h(7), h(8, 30)],
    [2, "engenharia-software", h(19), h(21)],
    [3, "programacao", h(8), h(10)],
    [3, "raciocinio-logico", h(20), h(21)],
    [4, "direito-administrativo", h(9), h(11)],
    [5, "portugues", h(9), h(11)],
    [5, "analise-dados", h(14), h(15, 30)],
  ];
  const blocos = plano.map(([d, materiaId, inicioMin, fimMin], i) => ({
    id: `exemplo-${i}`,
    materiaId,
    dia: dia(d),
    inicioMin,
    fimMin,
  }));

  const hojeDia = diaLocal(hoje);
  if (!blocos.some((b) => b.dia === hojeDia)) {
    blocos.push(
      { id: "exemplo-hoje-1", materiaId: "programacao", dia: hojeDia, inicioMin: h(8), fimMin: h(10) },
      { id: "exemplo-hoje-2", materiaId: "portugues", dia: hojeDia, inicioMin: h(10, 30), fimMin: h(12) },
      { id: "exemplo-hoje-3", materiaId: "analise-dados", dia: hojeDia, inicioMin: h(14), fimMin: h(15, 30) },
      { id: "exemplo-hoje-4", materiaId: "raciocinio-logico", dia: hojeDia, inicioMin: h(19), fimMin: h(20) },
    );
  }
  return blocos;
}

function ler(): Estado {
  if (typeof window === "undefined") return { blocos: [] };
  const bruto = window.localStorage.getItem(CHAVE);
  if (bruto) {
    try {
      return JSON.parse(bruto) as Estado;
    } catch {
      // estado corrompido: recomeça com o exemplo
    }
  }
  const inicial = { blocos: blocosExemplo() };
  gravar(inicial);
  return inicial;
}

function gravar(estado: Estado) {
  window.localStorage.setItem(CHAVE, JSON.stringify(estado));
}

function novoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bloco-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function listMaterias(): Promise<Materia[]> {
  return materiasExemplo;
}

/** Blocos com `dia` entre `inicio` e `fim`, inclusive. */
export async function listBlocos(inicio: string, fim: string): Promise<BlocoEstudo[]> {
  return ler()
    .blocos.filter((b) => b.dia >= inicio && b.dia <= fim)
    .sort((a, b) => a.dia.localeCompare(b.dia) || a.inicioMin - b.inicioMin);
}

export async function criarBloco(novo: NovoBloco): Promise<BlocoEstudo> {
  const estado = ler();
  const bloco = { ...novo, id: novoId() };
  gravar({ blocos: [...estado.blocos, bloco] });
  return bloco;
}

export async function atualizarBloco(id: string, mudancas: Partial<NovoBloco>): Promise<BlocoEstudo> {
  const estado = ler();
  const atual = estado.blocos.find((b) => b.id === id);
  if (!atual) throw new Error("Bloco não encontrado");
  const bloco = { ...atual, ...mudancas };
  gravar({ blocos: estado.blocos.map((b) => (b.id === id ? bloco : b)) });
  return bloco;
}

export async function removerBloco(id: string): Promise<void> {
  const estado = ler();
  gravar({ blocos: estado.blocos.filter((b) => b.id !== id) });
}

export async function restaurarExemplo(): Promise<void> {
  gravar({ blocos: blocosExemplo() });
}
