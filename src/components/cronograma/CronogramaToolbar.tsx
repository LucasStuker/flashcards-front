"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { botaoSecundario, focusRing } from "@/components/ui";

export type Visao = "semana" | "mes";

type Props = {
  titulo: string;
  visao: Visao;
  onVisao: (visao: Visao) => void;
  onAnterior: () => void;
  onProximo: () => void;
  onHoje: () => void;
};

const opcoes: { valor: Visao; rotulo: string }[] = [
  { valor: "mes", rotulo: "Mês" },
  { valor: "semana", rotulo: "Semana" },
];

export function CronogramaToolbar({ titulo, visao, onVisao, onAnterior, onProximo, onHoje }: Props) {
  const periodo = visao === "mes" ? "mês" : "semana";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onHoje} className={botaoSecundario}>
        Hoje
      </button>
      <div className="flex items-center">
        <button
          type="button"
          onClick={onAnterior}
          aria-label={`${periodo === "mês" ? "Mês" : "Semana"} anterior`}
          className={`rounded-full p-1.5 text-muted hover:bg-line/60 hover:text-ink ${focusRing}`}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onProximo}
          aria-label={`Próxim${periodo === "mês" ? "o mês" : "a semana"}`}
          className={`rounded-full p-1.5 text-muted hover:bg-line/60 hover:text-ink ${focusRing}`}
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <h2 className="mr-auto text-lg font-semibold text-ink" aria-live="polite">
        {titulo}
      </h2>
      <div role="group" aria-label="Visão do calendário" className="flex rounded-lg border border-line bg-paper p-0.5">
        {opcoes.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={visao === opcao.valor}
            onClick={() => onVisao(opcao.valor)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
              visao === opcao.valor ? "bg-panel text-ink shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
