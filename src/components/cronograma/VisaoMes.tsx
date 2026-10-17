"use client";

import { DragEvent, useMemo, useState } from "react";
import type { BlocoEstudo, Materia, NovoBloco } from "@/lib/cronograma-mock";
import { corDaMateria } from "./cores";
import { DURACAO_PADRAO, MIN_FIM, formatHora, hoje, mesmoMes, numeroDoDia } from "./datas";
import type { Arrasto } from "./useCronograma";

type Props = {
  referencia: string;
  dias: string[];
  blocos: BlocoEstudo[];
  porId: Map<string, Materia>;
  materiaSelecionada: string | null;
  blocoSelecionado: string | null;
  arrasto: Arrasto | null;
  onArrasto: (arrasto: Arrasto | null) => void;
  onCriar: (novo: NovoBloco) => void;
  onAtualizar: (id: string, mudancas: Partial<NovoBloco>) => void;
  onSelecionarBloco: (id: string | null) => void;
  onAbrirSemana: (dia: string) => void;
};

const VISIVEIS = 3;
const cabecalho = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Primeiro horário a partir das 08:00, em passos de 30 min, sem conflito no dia. */
function primeiroHorarioLivre(doDia: BlocoEstudo[], duracao: number) {
  for (let inicio = 8 * 60; inicio + duracao <= MIN_FIM; inicio += 30) {
    const fim = inicio + duracao;
    if (doDia.every((b) => b.fimMin <= inicio || b.inicioMin >= fim)) return { inicioMin: inicio, fimMin: fim };
  }
  return { inicioMin: 8 * 60, fimMin: 8 * 60 + duracao };
}

export function VisaoMes({
  referencia,
  dias,
  blocos,
  porId,
  materiaSelecionada,
  blocoSelecionado,
  arrasto,
  onArrasto,
  onCriar,
  onAtualizar,
  onSelecionarBloco,
  onAbrirSemana,
}: Props) {
  const [alvo, setAlvo] = useState<string | null>(null);
  const diaDeHoje = hoje();

  const porDia = useMemo(() => {
    const mapa = new Map<string, BlocoEstudo[]>();
    for (const bloco of blocos) mapa.set(bloco.dia, [...(mapa.get(bloco.dia) ?? []), bloco]);
    for (const lista of mapa.values()) lista.sort((a, b) => a.inicioMin - b.inicioMin);
    return mapa;
  }, [blocos]);

  function aoSoltar(dia: string, evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setAlvo(null);
    if (!arrasto) return;
    const doDia = porDia.get(dia) ?? [];
    if (arrasto.tipo === "materia") {
      onCriar({ materiaId: arrasto.materiaId, dia, ...primeiroHorarioLivre(doDia, DURACAO_PADRAO) });
    } else {
      onAtualizar(arrasto.blocoId, { dia });
    }
    onArrasto(null);
  }

  function aoClicarNoDia(dia: string) {
    if (!materiaSelecionada) {
      onAbrirSemana(dia);
      return;
    }
    onCriar({ materiaId: materiaSelecionada, dia, ...primeiroHorarioLivre(porDia.get(dia) ?? [], DURACAO_PADRAO) });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className="grid grid-cols-7 border-b border-line">
        {cabecalho.map((nome) => (
          <span key={nome} className="py-2 text-center text-[12px] font-medium uppercase text-muted">
            {nome}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {dias.map((dia, indice) => {
          const doDia = porDia.get(dia) ?? [];
          const foraDoMes = !mesmoMes(dia, referencia);
          const ehHoje = dia === diaDeHoje;
          return (
            <div
              key={dia}
              className={`flex min-h-28 flex-col gap-1 border-line p-1.5 transition-colors ${
                indice % 7 ? "border-l" : ""
              } ${indice >= 7 ? "border-t" : ""} ${foraDoMes ? "bg-paper/60" : ""} ${
                alvo === dia ? "bg-accent/8 ring-2 ring-inset ring-accent/40" : ""
              } ${materiaSelecionada ? "cursor-copy" : "cursor-pointer"}`}
              onDragOver={(evento) => {
                if (!arrasto) return;
                evento.preventDefault();
                evento.dataTransfer.dropEffect = arrasto.tipo === "bloco" ? "move" : "copy";
                if (alvo !== dia) setAlvo(dia);
              }}
              onDragLeave={(evento) => {
                if (!evento.currentTarget.contains(evento.relatedTarget as Node)) setAlvo(null);
              }}
              onDrop={(evento) => aoSoltar(dia, evento)}
              onClick={(evento) => {
                if (evento.target === evento.currentTarget) aoClicarNoDia(dia);
              }}
            >
              <button
                type="button"
                onClick={() => onAbrirSemana(dia)}
                aria-label={`Abrir a semana de ${dia.split("-").reverse().join("/")}`}
                className={`flex h-6 w-6 items-center justify-center self-start rounded-full text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  ehHoje
                    ? "bg-accent font-semibold text-panel"
                    : foraDoMes
                      ? "text-muted/70 hover:bg-line/60"
                      : "text-ink hover:bg-line/60"
                }`}
              >
                {numeroDoDia(dia)}
              </button>

              {doDia.slice(0, VISIVEIS).map((bloco) => {
                const materia = porId.get(bloco.materiaId);
                const cor = corDaMateria[materia?.cor ?? 6];
                const selecionado = blocoSelecionado === bloco.id;
                return (
                  <button
                    key={bloco.id}
                    type="button"
                    draggable
                    aria-pressed={selecionado}
                    onDragStart={(evento) => {
                      evento.dataTransfer.effectAllowed = "move";
                      evento.dataTransfer.setData("text/plain", bloco.id);
                      onArrasto({ tipo: "bloco", blocoId: bloco.id, duracao: bloco.fimMin - bloco.inicioMin, deslocamentoMin: 0 });
                    }}
                    onDragEnd={() => {
                      onArrasto(null);
                      setAlvo(null);
                    }}
                    onClick={() => onSelecionarBloco(selecionado ? null : bloco.id)}
                    className={`flex w-full cursor-grab items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing ${
                      cor.bloco
                    } ${selecionado ? "ring-2 ring-ink/40" : ""}`}
                  >
                    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${cor.ponto}`} />
                    <span className="shrink-0 tabular-nums text-muted">{formatHora(bloco.inicioMin)}</span>
                    <span className="truncate text-ink">{materia?.nome ?? "Matéria removida"}</span>
                  </button>
                );
              })}

              {doDia.length > VISIVEIS ? (
                <button
                  type="button"
                  onClick={() => onAbrirSemana(dia)}
                  className="self-start rounded px-1 text-[12px] font-medium text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                >
                  +{doDia.length - VISIVEIS} mais
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
