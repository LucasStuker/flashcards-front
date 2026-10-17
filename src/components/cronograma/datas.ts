export const HORA_INICIO = 6;
export const HORA_FIM = 24;
export const ALTURA_HORA = 48;
export const PASSO_MIN = 15;
export const DURACAO_PADRAO = 60;
export const MIN_INICIO = HORA_INICIO * 60;
export const MIN_FIM = HORA_FIM * 60;

const nomesDia = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function paraDia(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function paraData(dia: string) {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(ano, mes - 1, d);
}

export function somarDias(dia: string, dias: number) {
  const data = paraData(dia);
  data.setDate(data.getDate() + dias);
  return paraDia(data);
}

export function hoje() {
  return paraDia(new Date());
}

export function inicioDaSemana(dia: string) {
  return somarDias(dia, -((paraData(dia).getDay() + 6) % 7));
}

export function diasDaSemana(dia: string) {
  const segunda = inicioDaSemana(dia);
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}

/** 42 dias (6 semanas, começando na segunda) que cobrem o mês de `dia`. */
export function gradeDoMes(dia: string) {
  const data = paraData(dia);
  const primeiro = paraDia(new Date(data.getFullYear(), data.getMonth(), 1));
  const inicio = inicioDaSemana(primeiro);
  return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i));
}

export function mesmoMes(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function nomeDoDia(dia: string) {
  return nomesDia[paraData(dia).getDay()];
}

export function numeroDoDia(dia: string) {
  return paraData(dia).getDate();
}

export function formatHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDuracaoMin(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function arredondar(minutos: number) {
  return Math.round(minutos / PASSO_MIN) * PASSO_MIN;
}

export function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}

const formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const formatoDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const formatoCompleto = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function tituloDoMes(dia: string) {
  const texto = formatoMes.format(paraData(dia));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function tituloDaSemana(dia: string) {
  const dias = diasDaSemana(dia);
  const inicio = paraData(dias[0]);
  const fim = paraData(dias[6]);
  return `${formatoDiaMes.format(inicio)} – ${formatoDiaMes.format(fim)} de ${fim.getFullYear()}`;
}

export function diaPorExtenso(dia: string) {
  return formatoCompleto.format(paraData(dia));
}

export function minutosAgora() {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

/** Lado a lado quando os blocos se sobrepõem no mesmo dia. */
export function distribuirColunas<T extends { id: string; inicioMin: number; fimMin: number }>(blocos: T[]) {
  const ordenados = [...blocos].sort((a, b) => a.inicioMin - b.inicioMin || b.fimMin - a.fimMin);
  const posicao = new Map<string, { coluna: number; total: number }>();
  let grupo: T[] = [];
  let colunasFim: number[] = [];
  let fimDoGrupo = -1;

  const fecharGrupo = () => {
    for (const bloco of grupo) {
      const atual = posicao.get(bloco.id);
      if (atual) posicao.set(bloco.id, { ...atual, total: colunasFim.length });
    }
    grupo = [];
    colunasFim = [];
  };

  for (const bloco of ordenados) {
    if (bloco.inicioMin >= fimDoGrupo) fecharGrupo();
    let coluna = colunasFim.findIndex((fim) => fim <= bloco.inicioMin);
    if (coluna === -1) {
      coluna = colunasFim.length;
      colunasFim.push(bloco.fimMin);
    } else {
      colunasFim[coluna] = bloco.fimMin;
    }
    posicao.set(bloco.id, { coluna, total: 1 });
    grupo.push(bloco);
    fimDoGrupo = Math.max(fimDoGrupo, bloco.fimMin);
  }
  fecharGrupo();
  return posicao;
}
