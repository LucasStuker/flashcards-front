"use client";

import { GripVertical, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import type { BlocoEstudo, Materia, NovoBloco } from "@/lib/cronograma-mock";
import { focusRing } from "@/components/ui";
import { corDaMateria } from "./cores";
import { MIN_FIM, MIN_INICIO, PASSO_MIN, formatDuracaoMin, formatHora } from "./datas";
import type { Arrasto } from "./useCronograma";

type Props = {
  materias: Materia[];
  blocos: BlocoEstudo[];
  materiaSelecionada: string | null;
  onSelecionarMateria: (id: string | null) => void;
  onArrasto: (arrasto: Arrasto | null) => void;
  bloco: BlocoEstudo | null;
  onAtualizar: (id: string, mudancas: Partial<NovoBloco>) => void;
  onRemover: (id: string) => void;
  onFecharBloco: () => void;
  rotuloPeriodo: string;
};

const horarios = Array.from({ length: (MIN_FIM - MIN_INICIO) / PASSO_MIN + 1 }, (_, i) => MIN_INICIO + i * PASSO_MIN);
const campo = `w-full rounded-md border border-line bg-panel px-2 py-1.5 text-sm text-ink ${focusRing}`;

export function MateriasPainel({
  materias,
  blocos,
  materiaSelecionada,
  onSelecionarMateria,
  onArrasto,
  bloco,
  onAtualizar,
  onRemover,
  onFecharBloco,
  rotuloPeriodo,
}: Props) {
  const minutosPorMateria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const b of blocos) mapa.set(b.materiaId, (mapa.get(b.materiaId) ?? 0) + b.fimMin - b.inicioMin);
    return mapa;
  }, [blocos]);

  return (
    <aside className="flex flex-col gap-4">
      <section aria-labelledby="titulo-materias" className="rounded-xl border border-line bg-panel p-3 shadow-card">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="titulo-materias" className="text-sm font-semibold text-ink">
            Matérias
          </h2>
          <span className="text-[12px] text-muted">{rotuloPeriodo}</span>
        </div>
        <p className="mb-3 text-[12px] leading-snug text-muted">
          Arraste para o calendário ou selecione e clique num horário.
        </p>
        <ul className="flex flex-col gap-1.5">
          {materias.map((materia) => {
            const cor = corDaMateria[materia.cor];
            const selecionada = materiaSelecionada === materia.id;
            const minutos = minutosPorMateria.get(materia.id) ?? 0;
            return (
              <li key={materia.id}>
                <button
                  type="button"
                  draggable
                  aria-pressed={selecionada}
                  onDragStart={(evento) => {
                    evento.dataTransfer.effectAllowed = "copy";
                    evento.dataTransfer.setData("text/plain", materia.nome);
                    onArrasto({ tipo: "materia", materiaId: materia.id });
                  }}
                  onDragEnd={() => onArrasto(null)}
                  onClick={() => onSelecionarMateria(selecionada ? null : materia.id)}
                  className={`flex w-full cursor-grab items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm transition-colors active:cursor-grabbing ${focusRing} ${
                    selecionada ? `${cor.borda} ${cor.bloco}` : "border-line bg-panel hover:bg-paper"
                  }`}
                >
                  <GripVertical aria-hidden="true" className="h-4 w-4 shrink-0 text-muted/70" />
                  <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor.ponto}`} />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{materia.nome}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted">
                    {minutos ? formatDuracaoMin(minutos) : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {bloco ? (
        <BlocoEditor
          key={bloco.id}
          bloco={bloco}
          materias={materias}
          onAtualizar={onAtualizar}
          onRemover={onRemover}
          onFechar={onFecharBloco}
        />
      ) : null}
    </aside>
  );
}

function BlocoEditor({
  bloco,
  materias,
  onAtualizar,
  onRemover,
  onFechar,
}: {
  bloco: BlocoEstudo;
  materias: Materia[];
  onAtualizar: (id: string, mudancas: Partial<NovoBloco>) => void;
  onRemover: (id: string) => void;
  onFechar: () => void;
}) {
  return (
    <section aria-labelledby="titulo-bloco" className="rounded-xl border border-line bg-panel p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="titulo-bloco" className="text-sm font-semibold text-ink">
          Bloco selecionado
        </h2>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar edição do bloco"
          className={`rounded-full p-1 text-muted hover:bg-line/60 hover:text-ink ${focusRing}`}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-muted">
          Matéria
          <select
            className={campo}
            value={bloco.materiaId}
            onChange={(e) => onAtualizar(bloco.id, { materiaId: e.target.value })}
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-muted">
          Dia
          <input
            type="date"
            className={campo}
            value={bloco.dia}
            onChange={(e) => e.target.value && onAtualizar(bloco.id, { dia: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[12px] font-medium text-muted">
            Início
            <select
              className={campo}
              value={bloco.inicioMin}
              onChange={(e) => {
                const inicioMin = Number(e.target.value);
                const duracao = bloco.fimMin - bloco.inicioMin;
                onAtualizar(bloco.id, { inicioMin, fimMin: Math.min(MIN_FIM, inicioMin + duracao) });
              }}
            >
              {horarios.slice(0, -1).map((m) => (
                <option key={m} value={m}>
                  {formatHora(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-muted">
            Fim
            <select
              className={campo}
              value={bloco.fimMin}
              onChange={(e) => onAtualizar(bloco.id, { fimMin: Number(e.target.value) })}
            >
              {horarios
                .filter((m) => m > bloco.inicioMin)
                .map((m) => (
                  <option key={m} value={m}>
                    {formatHora(m)}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="text-[12px] text-muted">Duração: {formatDuracaoMin(bloco.fimMin - bloco.inicioMin)}</p>
        <button
          type="button"
          onClick={() => onRemover(bloco.id)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-bad/30 px-3 py-1.5 text-sm font-medium text-bad transition-colors hover:bg-bad/5 ${focusRing}`}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Remover bloco
        </button>
      </div>
    </section>
  );
}
