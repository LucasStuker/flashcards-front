"use client";

import { useState } from "react";
import { DesempenhoSemana } from "@/lib/api";
import {
  Metrica,
  diaCurto,
  diaDaSemana,
  escala,
  formatDuracao,
  formatPct,
  formatValor,
  valorDaMetrica,
} from "./formato";

const L = 720;
const A = 240;
const margem = { topo: 16, direita: 8, base: 28, esquerda: 52 };
const largura = L - margem.esquerda - margem.direita;
const altura = A - margem.topo - margem.base;

type Props = { dados: DesempenhoSemana; metrica: Metrica };

export function GraficoSemana({ dados, metrica }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const valores = dados.dias.map((dia) => (dia.futuro ? null : valorDaMetrica(dia, metrica)));
  const maximo = Math.max(0, ...valores.map((v) => v ?? 0));
  const { topo, ticks } = escala(maximo, metrica);
  const faixa = largura / dados.dias.length;
  const larguraBarra = Math.min(44, faixa * 0.55);
  const y = (valor: number) => margem.topo + altura - (valor / topo) * altura;

  const diaAtivo = ativo === null ? null : dados.dias[ativo];

  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="group" aria-label="Estudo por dia da semana">
        {ticks.map((tick) => (
          <g key={tick.valor}>
            <line
              x1={margem.esquerda}
              x2={L - margem.direita}
              y1={y(tick.valor)}
              y2={y(tick.valor)}
              className="stroke-line"
              strokeDasharray={tick.valor === 0 ? undefined : "3 4"}
            />
            <text
              x={margem.esquerda - 8}
              y={y(tick.valor)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted text-[12px]"
            >
              {tick.rotulo}
            </text>
          </g>
        ))}

        {dados.dias.map((dia, i) => {
          const valor = valores[i];
          const centro = margem.esquerda + faixa * i + faixa / 2;
          const temBarra = valor !== null && valor > 0;
          const rotulo = `${diaDaSemana(dia.dia)}, ${diaCurto(dia.dia)}: ${
            dia.futuro ? "ainda não chegou" : formatValor(valor, metrica)
          }`;
          return (
            <g
              key={dia.dia}
              tabIndex={dia.futuro ? -1 : 0}
              role="img"
              aria-label={rotulo}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              className="outline-none"
            >
              <rect
                x={margem.esquerda + faixa * i}
                y={margem.topo}
                width={faixa}
                height={altura}
                className={ativo === i ? "fill-paper" : "fill-transparent"}
              />
              {temBarra ? (
                <rect
                  x={centro - larguraBarra / 2}
                  y={y(valor)}
                  width={larguraBarra}
                  height={Math.max(2, margem.topo + altura - y(valor))}
                  rx={4}
                  className={ativo === i ? "fill-accent-deep" : "fill-accent"}
                />
              ) : null}
              {ativo === i && valor !== null && !dia.futuro ? (
                <text
                  x={centro}
                  y={(temBarra ? y(valor) : margem.topo + altura) - 6}
                  textAnchor="middle"
                  className="fill-ink text-[12px] font-semibold"
                >
                  {formatValor(valor, metrica)}
                </text>
              ) : null}
              <text
                x={centro}
                y={A - 8}
                textAnchor="middle"
                className={`text-[12px] ${dia.futuro ? "fill-muted/50" : "fill-muted"}`}
              >
                {diaDaSemana(dia.dia)}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 min-h-5 text-[13px] text-muted" aria-live="polite">
        {diaAtivo && !diaAtivo.futuro ? (
          <>
            <span className="font-medium text-ink">
              {diaDaSemana(diaAtivo.dia)}, {diaCurto(diaAtivo.dia)}:
            </span>{" "}
            {formatDuracao(diaAtivo.segundos)} · {diaAtivo.questoes}{" "}
            {diaAtivo.questoes === 1 ? "questão" : "questões"} · {formatPct(diaAtivo.taxa)} de acerto
          </>
        ) : dados.totais.segundos === 0 && dados.totais.questoes === 0 ? (
          "Nenhum estudo nesta semana."
        ) : (
          <>
            <span className="font-medium text-ink">Na semana:</span> {formatDuracao(dados.totais.segundos)} ·{" "}
            {dados.totais.questoes} {dados.totais.questoes === 1 ? "questão" : "questões"} ·{" "}
            {formatPct(dados.totais.taxa)} de acerto
          </>
        )}
      </p>
    </div>
  );
}
