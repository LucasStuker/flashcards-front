"use client";

import { DragEvent, KeyboardEvent, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import type { BlocoEstudo, Materia, NovoBloco } from "@/lib/cronograma-mock";
import { corDaMateria } from "./cores";
import {
  ALTURA_HORA,
  DURACAO_PADRAO,
  HORA_FIM,
  HORA_INICIO,
  MIN_FIM,
  MIN_INICIO,
  PASSO_MIN,
  arredondar,
  distribuirColunas,
  formatHora,
  hoje,
  limitar,
  minutosAgora,
  nomeDoDia,
  numeroDoDia,
} from "./datas";
import type { Arrasto } from "./useCronograma";

type Props = {
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
};

type Previa = { dia: string; inicioMin: number; fimMin: number };

const ALTURA_TOTAL = (HORA_FIM - HORA_INICIO) * ALTURA_HORA;
const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);
const colunas = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]";

function minutoNoPonto(evento: { clientY: number; currentTarget: Element }) {
  const topo = evento.currentTarget.getBoundingClientRect().top;
  return MIN_INICIO + ((evento.clientY - topo) / ALTURA_HORA) * 60;
}

function y(minutos: number) {
  return ((minutos - MIN_INICIO) / 60) * ALTURA_HORA;
}

function horarioParaMateria(minuto: number) {
  const inicio = limitar(Math.floor(minuto / PASSO_MIN) * PASSO_MIN, MIN_INICIO, MIN_FIM - DURACAO_PADRAO);
  return { inicioMin: inicio, fimMin: inicio + DURACAO_PADRAO };
}

export function VisaoSemana({
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
}: Props) {
  const rolagem = useRef<HTMLDivElement>(null);
  const redimensionamento = useRef<{ id: string; y: number; inicio: number; fim: number } | null>(null);
  const [fimProvisorio, setFimProvisorio] = useState<{ id: string; fimMin: number } | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [agora, setAgora] = useState(minutosAgora);
  const diaDeHoje = hoje();

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(minutosAgora()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const alvo = dias.includes(diaDeHoje) ? minutosAgora() - 90 : 7 * 60;
    rolagem.current?.scrollTo({ top: Math.max(0, y(alvo)) });
  }, [dias, diaDeHoje]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, BlocoEstudo[]>();
    for (const bloco of blocos) mapa.set(bloco.dia, [...(mapa.get(bloco.dia) ?? []), bloco]);
    return mapa;
  }, [blocos]);

  function horarioDoArrasto(minuto: number) {
    if (arrasto?.tipo === "bloco") {
      const inicio = limitar(arredondar(minuto - arrasto.deslocamentoMin), MIN_INICIO, MIN_FIM - arrasto.duracao);
      return { inicioMin: inicio, fimMin: inicio + arrasto.duracao };
    }
    return horarioParaMateria(minuto);
  }

  function aoArrastarSobre(dia: string, evento: DragEvent<HTMLDivElement>) {
    if (!arrasto) return;
    evento.preventDefault();
    evento.dataTransfer.dropEffect = arrasto.tipo === "bloco" ? "move" : "copy";
    const horario = horarioDoArrasto(minutoNoPonto(evento));
    if (previa?.dia !== dia || previa.inicioMin !== horario.inicioMin) setPrevia({ dia, ...horario });
  }

  function aoSoltar(dia: string, evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    if (!arrasto) return;
    const horario = horarioDoArrasto(minutoNoPonto(evento));
    if (arrasto.tipo === "materia") onCriar({ materiaId: arrasto.materiaId, dia, ...horario });
    else onAtualizar(arrasto.blocoId, { dia, ...horario });
    setPrevia(null);
    onArrasto(null);
  }

  function aoClicarNoDia(dia: string, evento: MouseEvent<HTMLDivElement>) {
    if (evento.target !== evento.currentTarget) return;
    if (!materiaSelecionada) {
      onSelecionarBloco(null);
      return;
    }
    onCriar({ materiaId: materiaSelecionada, dia, ...horarioParaMateria(minutoNoPonto(evento)) });
  }

  function iniciarRedimensionamento(bloco: BlocoEstudo, evento: PointerEvent<HTMLDivElement>) {
    evento.stopPropagation();
    evento.preventDefault();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    redimensionamento.current = { id: bloco.id, y: evento.clientY, inicio: bloco.inicioMin, fim: bloco.fimMin };
    setFimProvisorio({ id: bloco.id, fimMin: bloco.fimMin });
  }

  function redimensionar(evento: PointerEvent<HTMLDivElement>) {
    const atual = redimensionamento.current;
    if (!atual) return;
    const delta = ((evento.clientY - atual.y) / ALTURA_HORA) * 60;
    const fimMin = limitar(arredondar(atual.fim + delta), atual.inicio + PASSO_MIN, MIN_FIM);
    setFimProvisorio((anterior) => (anterior?.fimMin === fimMin ? anterior : { id: atual.id, fimMin }));
  }

  function terminarRedimensionamento() {
    const atual = redimensionamento.current;
    redimensionamento.current = null;
    if (atual && fimProvisorio && fimProvisorio.fimMin !== atual.fim) {
      onAtualizar(atual.id, { fimMin: fimProvisorio.fimMin });
    }
    setFimProvisorio(null);
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className={`${colunas} border-b border-line`}>
        <div />
        {dias.map((dia) => {
          const ehHoje = dia === diaDeHoje;
          return (
            <div key={dia} className="flex flex-col items-center gap-0.5 border-l border-line py-2">
              <span className={`text-[12px] font-medium uppercase ${ehHoje ? "text-accent" : "text-muted"}`}>
                {nomeDoDia(dia)}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  ehHoje ? "bg-accent font-semibold text-panel" : "text-ink"
                }`}
              >
                {numeroDoDia(dia)}
              </span>
            </div>
          );
        })}
      </div>

      <div ref={rolagem} className="max-h-[calc(100vh-15rem)] min-h-[24rem] overflow-y-auto">
        <div className={colunas} style={{ height: ALTURA_TOTAL }}>
          <div className="relative">
            {horas.map((hora) => (
              <span
                key={hora}
                className="absolute right-2 -translate-y-1/2 text-[12px] tabular-nums text-muted"
                style={{ top: y(hora * 60) }}
              >
                {hora === HORA_INICIO ? "" : formatHora(hora * 60)}
              </span>
            ))}
          </div>

          {dias.map((dia) => {
            const doDia = porDia.get(dia) ?? [];
            const posicoes = distribuirColunas(doDia);
            return (
              <div
                key={dia}
                className={`relative border-l border-line ${materiaSelecionada ? "cursor-copy" : ""}`}
                style={{
                  backgroundImage: "linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
                  backgroundSize: `100% ${ALTURA_HORA}px`,
                }}
                onDragOver={(evento) => aoArrastarSobre(dia, evento)}
                onDragLeave={(evento) => {
                  if (!evento.currentTarget.contains(evento.relatedTarget as Node)) setPrevia(null);
                }}
                onDrop={(evento) => aoSoltar(dia, evento)}
                onClick={(evento) => aoClicarNoDia(dia, evento)}
              >
                {previa?.dia === dia ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 z-10 rounded-md border-2 border-dashed border-accent/60 bg-accent/5 px-1.5 py-1 text-[12px] font-medium text-accent"
                    style={{ top: y(previa.inicioMin), height: y(previa.fimMin) - y(previa.inicioMin) }}
                  >
                    {formatHora(previa.inicioMin)} – {formatHora(previa.fimMin)}
                  </div>
                ) : null}

                {doDia.map((bloco) => {
                  const materia = porId.get(bloco.materiaId);
                  const cor = corDaMateria[materia?.cor ?? 6];
                  const fimMin = fimProvisorio?.id === bloco.id ? fimProvisorio.fimMin : bloco.fimMin;
                  const altura = y(fimMin) - y(bloco.inicioMin);
                  const { coluna, total } = posicoes.get(bloco.id) ?? { coluna: 0, total: 1 };
                  const selecionado = blocoSelecionado === bloco.id;
                  const nome = materia?.nome ?? "Matéria removida";
                  return (
                    <div
                      key={bloco.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      aria-label={`${nome}, ${formatHora(bloco.inicioMin)} às ${formatHora(fimMin)}`}
                      aria-pressed={selecionado}
                      onDragStart={(evento) => {
                        if (redimensionamento.current) {
                          evento.preventDefault();
                          return;
                        }
                        const topo = evento.currentTarget.getBoundingClientRect().top;
                        evento.dataTransfer.effectAllowed = "move";
                        evento.dataTransfer.setData("text/plain", bloco.id);
                        onArrasto({
                          tipo: "bloco",
                          blocoId: bloco.id,
                          duracao: bloco.fimMin - bloco.inicioMin,
                          deslocamentoMin: ((evento.clientY - topo) / ALTURA_HORA) * 60,
                        });
                      }}
                      onDragEnd={() => {
                        onArrasto(null);
                        setPrevia(null);
                      }}
                      onClick={(evento) => {
                        evento.stopPropagation();
                        onSelecionarBloco(selecionado ? null : bloco.id);
                      }}
                      onKeyDown={(evento: KeyboardEvent<HTMLDivElement>) => {
                        if (evento.key === "Enter" || evento.key === " ") {
                          evento.preventDefault();
                          onSelecionarBloco(selecionado ? null : bloco.id);
                        }
                      }}
                      className={`group absolute z-20 cursor-grab overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-[12px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing ${cor.bloco} ${cor.borda} ${
                        selecionado ? "ring-2 ring-ink/40" : ""
                      } ${arrasto?.tipo === "bloco" && arrasto.blocoId === bloco.id ? "opacity-40" : ""}`}
                      style={{
                        top: y(bloco.inicioMin) + 1,
                        height: Math.max(18, altura - 2),
                        left: `calc(${(coluna / total) * 100}% + 2px)`,
                        width: `calc(${100 / total}% - 4px)`,
                      }}
                    >
                      <p className="truncate font-medium text-ink">{nome}</p>
                      {altura >= 34 ? (
                        <p className="truncate tabular-nums text-muted">
                          {formatHora(bloco.inicioMin)} – {formatHora(fimMin)}
                        </p>
                      ) : null}
                      <div
                        aria-hidden="true"
                        draggable={false}
                        onPointerDown={(evento) => iniciarRedimensionamento(bloco, evento)}
                        onPointerMove={redimensionar}
                        onPointerUp={terminarRedimensionamento}
                        onPointerCancel={terminarRedimensionamento}
                        onMouseDown={(evento) => evento.stopPropagation()}
                        onClick={(evento) => evento.stopPropagation()}
                        className="absolute inset-x-0 bottom-0 flex h-2.5 cursor-ns-resize items-end justify-center pb-0.5"
                      >
                        <span className="h-0.5 w-6 rounded-full bg-ink/30 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}

                {dia === diaDeHoje && agora >= MIN_INICIO && agora < MIN_FIM ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-30 h-px bg-bad"
                    style={{ top: y(agora) }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-bad" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
