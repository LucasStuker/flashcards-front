import Link from "next/link";
import { ReactNode } from "react";
import { Dashboard } from "@/lib/api";
import { NavIcon, NavIconName } from "../NavIcon";
import { linkAcao } from "../ui";

type Props = {
  resumo: Dashboard["resumo"] | null;
  loading: boolean;
};

export function formatDuracao(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${minutos}min`;
  return resto === 0 ? `${horas}h` : `${horas}h ${String(resto).padStart(2, "0")}min`;
}

function comparacaoSemanal(atual: number, anterior: number) {
  if (atual === 0 && anterior === 0) return "Sem sessão cronometrada ainda";
  if (anterior === 0) return "Semana passada sem sessão";
  const diferenca = atual - anterior;
  if (Math.abs(diferenca) < 60) return "Igual à semana passada";
  const quanto = formatDuracao(Math.abs(diferenca));
  return diferenca > 0
    ? `${quanto} a mais que a semana passada (${formatDuracao(anterior)})`
    : `${quanto} a menos que a semana passada (${formatDuracao(anterior)})`;
}

const tons = {
  accent: "bg-accent/10 text-accent",
  warn: "bg-warn/10 text-warn",
  neutro: "bg-paper text-muted",
};

const cardClass = "flex flex-col rounded-xl border border-line bg-panel p-4 shadow-card";

function Indicador({
  icone,
  tom,
  rotulo,
  valor,
  detalhe,
  valorClass = "text-ink",
}: {
  icone: NavIconName;
  tom: keyof typeof tons;
  rotulo: string;
  valor: string;
  detalhe: ReactNode;
  valorClass?: string;
}) {
  return (
    <div className={cardClass}>
      <dt className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tons[tom]}`}>
          <NavIcon name={icone} />
        </span>
        {rotulo}
      </dt>
      <dd
        className={`mt-3 font-display text-3xl font-semibold tracking-tight tabular-nums ${valorClass}`}
      >
        {valor}
      </dd>
      <dd className="mt-1 text-[13px] text-muted">{detalhe}</dd>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cardClass}>
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-paper motion-safe:animate-pulse" />
            <span className="h-3 w-24 rounded bg-paper motion-safe:animate-pulse" />
          </div>
          <span className="mt-4 h-7 w-16 rounded bg-paper motion-safe:animate-pulse" />
          <span className="mt-2 h-3 w-32 rounded bg-paper motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ResumoPainel({ resumo, loading }: Props) {
  if (loading || !resumo) {
    return (
      <div aria-live="polite">
        <p className={loading ? "sr-only" : `${cardClass} text-sm text-muted`}>
          {loading ? "Carregando resumo…" : "Resumo indisponível."}
        </p>
        {loading ? <Esqueleto /> : null}
      </div>
    );
  }

  const { semana, acertos, sequencia, revisoesHoje } = resumo;
  const vencidas = revisoesHoje.topicos > 0;

  return (
    <section aria-labelledby="resumo-heading">
      <h2 id="resumo-heading" className="sr-only">
        Resumo
      </h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador
          icone="timer"
          tom="accent"
          rotulo="Tempo líquido na semana"
          valor={formatDuracao(semana.atualSegundos)}
          detalhe={comparacaoSemanal(semana.atualSegundos, semana.anteriorSegundos)}
        />
        <Indicador
          icone="check"
          tom="accent"
          rotulo={`Acertos em ${acertos.dias} dias`}
          valor={acertos.taxa === null ? "—" : `${Math.round(acertos.taxa * 100)}%`}
          detalhe={
            acertos.taxa === null
              ? "Nenhuma questão no período"
              : `${acertos.corretas} de ${acertos.total} questões`
          }
        />
        <Indicador
          icone="flame"
          tom={sequencia > 0 ? "accent" : "neutro"}
          rotulo="Sequência"
          valor={String(sequencia)}
          detalhe={
            sequencia === 0
              ? "Estude hoje para começar"
              : sequencia === 1
                ? "dia seguido"
                : "dias seguidos"
          }
        />
        <Indicador
          icone="repeat"
          tom={vencidas ? "warn" : "neutro"}
          rotulo="Revisões vencidas"
          valor={String(revisoesHoje.topicos)}
          valorClass={vencidas ? "text-warn" : "text-ink"}
          detalhe={
            vencidas ? (
              <span className="flex flex-wrap items-center gap-x-2">
                <span>
                  {revisoesHoje.cards} {revisoesHoje.cards === 1 ? "card" : "cards"} em{" "}
                  {revisoesHoje.topicos} {revisoesHoje.topicos === 1 ? "tópico" : "tópicos"}
                </span>
                <Link href="/decks" className={linkAcao}>
                  Revisar
                  <NavIcon name="chevron-right" className="h-3.5 w-3.5" />
                </Link>
              </span>
            ) : (
              "Nada vence hoje"
            )
          }
        />
      </dl>
    </section>
  );
}
