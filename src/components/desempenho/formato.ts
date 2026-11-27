import { formatDuracao } from "../dashboard/ResumoPainel";

export { formatDuracao };

export type Metrica = "tempo" | "questoes" | "taxa";

export const metricas: { id: Metrica; rotulo: string }[] = [
  { id: "tempo", rotulo: "Tempo de estudo" },
  { id: "questoes", rotulo: "Questões" },
  { id: "taxa", rotulo: "Taxa de acerto" },
];

const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function paraData(dia: string) {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, d));
}

export function diaCurto(dia: string) {
  const [, mes, d] = dia.split("-");
  return `${d}/${mes}`;
}

export function diaDaSemana(dia: string) {
  return diasDaSemana[paraData(dia).getUTCDay()];
}

export function formatPct(fracao: number | null) {
  return fracao === null ? "—" : `${Math.round(fracao * 100)}%`;
}

function formatTickTempo(segundos: number) {
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return minutos === 0 ? "0" : `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}`;
}

const DIVISOES = 4;
const passosMinutos = [5, 10, 15, 30, 60, 120, 180, 240, 360, 480, 720];
const passosQuestoes = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

function escolherPasso(maximo: number, passos: number[]) {
  return passos.find((passo) => passo * DIVISOES >= maximo) ?? passos[passos.length - 1];
}

/** Topo do eixo e rótulos, em valores redondos e sem repetir. */
export function escala(maximo: number, metrica: Metrica) {
  if (metrica === "taxa") {
    return { topo: 1, ticks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ valor: v, rotulo: formatPct(v) })) };
  }
  const passo =
    metrica === "tempo"
      ? escolherPasso(maximo / 60, passosMinutos) * 60
      : escolherPasso(maximo, passosQuestoes);
  const ticks = Array.from({ length: DIVISOES + 1 }, (_, i) => {
    const valor = passo * i;
    return { valor, rotulo: metrica === "tempo" ? formatTickTempo(valor) : String(valor) };
  });
  return { topo: passo * DIVISOES, ticks };
}

export function valorDaMetrica(
  dia: { segundos: number; questoes: number; taxa: number | null },
  metrica: Metrica,
): number | null {
  if (metrica === "tempo") return dia.segundos;
  if (metrica === "questoes") return dia.questoes;
  return dia.taxa;
}

export function formatValor(valor: number | null, metrica: Metrica) {
  if (valor === null) return "sem questões";
  if (metrica === "tempo") return formatDuracao(valor);
  if (metrica === "questoes") return `${valor} ${valor === 1 ? "questão" : "questões"}`;
  return formatPct(valor);
}

export const series = [
  { id: "taxa", rotulo: "Acerto", fill: "fill-accent", stroke: "stroke-accent", bg: "bg-accent" },
  { id: "tempo", rotulo: "Tempo", fill: "fill-serie-tempo", stroke: "stroke-serie-tempo", bg: "bg-serie-tempo" },
  {
    id: "questoes",
    rotulo: "Questões",
    fill: "fill-serie-questoes",
    stroke: "stroke-serie-questoes",
    bg: "bg-serie-questoes",
  },
] as const;

export type SerieId = (typeof series)[number]["id"];

export function valorDaSerie(
  disciplina: { taxa: number | null; participacaoTempo: number; participacaoQuestoes: number },
  serie: SerieId,
) {
  if (serie === "taxa") return disciplina.taxa;
  if (serie === "tempo") return disciplina.participacaoTempo;
  return disciplina.participacaoQuestoes;
}
