"use client";

import { useEffect, useState } from "react";
import { NavIcon } from "@/components/NavIcon";
import { focusRing } from "@/components/ui";
import { ProgressoTopico, ResumoProgresso, TopicoVerticalizado, Verticalizado } from "@/lib/api";

type Salvar = (topicoId: number, progresso: ProgressoTopico) => Promise<boolean>;

const ETAPAS = [
  { campo: "teoriaEm", rotulo: "Teoria" },
  { campo: "revisao1Em", rotulo: "R1" },
  { campo: "revisao2Em", rotulo: "R2" },
  { campo: "revisao3Em", rotulo: "R3" },
] as const;

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function diaMes(data: string) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

function percentual(parte: number, total: number) {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

function taxaTexto(taxa: number | null) {
  return taxa === null ? "—" : `${Math.round(taxa * 100)}%`;
}

function Barra({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <span
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      className="block h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      <span className="block h-full rounded-full bg-accent" style={{ width: `${valor}%` }} />
    </span>
  );
}

export function ResumoVerticalizado({ resumo }: { resumo: ResumoProgresso }) {
  const teoria = percentual(resumo.teoria, resumo.topicos);
  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card sm:grid-cols-3">
      <div className="flex flex-col gap-1.5 bg-panel px-4 py-3">
        <dt className="text-[13px] text-muted">Teoria</dt>
        <dd className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-ink">
            {teoria}%{" "}
            <span className="text-[13px] font-normal text-muted">
              {resumo.teoria} de {resumo.topicos} tópicos
            </span>
          </span>
          <Barra valor={teoria} rotulo="Teoria estudada no edital" />
        </dd>
      </div>
      <div className="flex flex-col gap-1.5 bg-panel px-4 py-3">
        <dt className="text-[13px] text-muted">Revisados</dt>
        <dd className="text-lg font-semibold text-ink">
          {resumo.revisados}{" "}
          <span className="text-[13px] font-normal text-muted">
            {resumo.revisados === 1 ? "tópico com R1" : "tópicos com R1"}
          </span>
        </dd>
      </div>
      <div className="flex flex-col gap-1.5 bg-panel px-4 py-3">
        <dt className="text-[13px] text-muted">Questões</dt>
        <dd className="text-lg font-semibold text-ink">
          {resumo.questoes}{" "}
          <span className="text-[13px] font-normal text-muted">
            {resumo.taxa === null ? "sem questões lançadas" : `${taxaTexto(resumo.taxa)} de acerto`}
          </span>
        </dd>
      </div>
    </dl>
  );
}

type TabelaProps = {
  verticalizado: Verticalizado;
  salvando: number | null;
  onSalvar: Salvar;
};

export function TabelaVerticalizado({ verticalizado, salvando, onSalvar }: TabelaProps) {
  return (
    <ul className="flex flex-col gap-2">
      {verticalizado.disciplinas.map((disciplina) => {
        const teoria = percentual(disciplina.resumo.teoria, disciplina.resumo.topicos);
        return (
          <li key={disciplina.id} className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
            <details className="group">
              <summary
                className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 hover:bg-paper ${focusRing}`}
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                  <NavIcon
                    name="chevron-right"
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-90"
                  />
                  {disciplina.nome}
                </span>
                <span className="flex items-center gap-3 text-[13px] text-muted">
                  <span className="w-24">
                    <Barra valor={teoria} rotulo={`Teoria estudada em ${disciplina.nome}`} />
                  </span>
                  <span className="w-20 tabular-nums">
                    {disciplina.resumo.teoria}/{disciplina.resumo.topicos} teoria
                  </span>
                  <span className="w-16 text-right tabular-nums">{taxaTexto(disciplina.resumo.taxa)}</span>
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-paper/60 text-left text-[12px] text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Tópico
                      </th>
                      {ETAPAS.map((etapa) => (
                        <th key={etapa.campo} scope="col" className="w-20 px-2 py-2 text-center font-medium">
                          {etapa.rotulo}
                        </th>
                      ))}
                      <th scope="col" className="w-20 px-2 py-2 text-center font-medium">
                        Questões
                      </th>
                      <th scope="col" className="w-20 px-2 py-2 text-center font-medium">
                        Acertos
                      </th>
                      <th scope="col" className="w-16 px-4 py-2 text-right font-medium">
                        Acerto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <Linhas topicos={disciplina.topicos} nivel={0} salvando={salvando} onSalvar={onSalvar} />
                  </tbody>
                </table>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

type LinhasProps = {
  topicos: TopicoVerticalizado[];
  nivel: number;
  salvando: number | null;
  onSalvar: Salvar;
};

function Linhas({ topicos, nivel, salvando, onSalvar }: LinhasProps) {
  return (
    <>
      {topicos.map((topico) =>
        topico.progresso ? (
          <LinhaFolha
            key={topico.id}
            topico={topico}
            progresso={topico.progresso}
            nivel={nivel}
            salvando={salvando === topico.id}
            onSalvar={onSalvar}
          />
        ) : (
          <LinhaPai key={topico.id} topico={topico} nivel={nivel} salvando={salvando} onSalvar={onSalvar} />
        ),
      )}
    </>
  );
}

function LinhaPai({
  topico,
  nivel,
  salvando,
  onSalvar,
}: {
  topico: TopicoVerticalizado;
  nivel: number;
  salvando: number | null;
  onSalvar: Salvar;
}) {
  const { resumo } = topico;
  return (
    <>
      <tr className="border-t border-line bg-paper/30 text-[13px] text-muted">
        <th
          scope="row"
          className="px-4 py-2 text-left text-sm font-medium text-ink"
          style={{ paddingLeft: `${1 + nivel * 1.25}rem` }}
        >
          {topico.nome}
        </th>
        <td className="px-2 py-2 text-center tabular-nums">
          {resumo.teoria}/{resumo.topicos}
        </td>
        <td className="px-2 py-2 text-center tabular-nums">
          {resumo.revisados}/{resumo.topicos}
        </td>
        <td />
        <td />
        <td className="px-2 py-2 text-center tabular-nums">{resumo.questoes}</td>
        <td className="px-2 py-2 text-center tabular-nums">{resumo.acertos}</td>
        <td className="px-4 py-2 text-right tabular-nums">{taxaTexto(resumo.taxa)}</td>
      </tr>
      <Linhas topicos={topico.filhos} nivel={nivel + 1} salvando={salvando} onSalvar={onSalvar} />
    </>
  );
}

type LinhaFolhaProps = {
  topico: TopicoVerticalizado;
  progresso: ProgressoTopico;
  nivel: number;
  salvando: boolean;
  onSalvar: Salvar;
};

function LinhaFolha({ topico, progresso, nivel, salvando, onSalvar }: LinhaFolhaProps) {
  const [questoes, setQuestoes] = useState(String(progresso.questoes));
  const [acertos, setAcertos] = useState(String(progresso.acertos));

  useEffect(() => {
    setQuestoes(String(progresso.questoes));
    setAcertos(String(progresso.acertos));
  }, [progresso.questoes, progresso.acertos]);

  const datas = ETAPAS.map((etapa) => progresso[etapa.campo]);

  function alternar(indice: number) {
    const etapa = ETAPAS[indice];
    void onSalvar(topico.id, {
      ...progresso,
      [etapa.campo]: progresso[etapa.campo] ? null : hoje(),
    });
  }

  function salvarNumeros() {
    const q = Number(questoes);
    const a = Number(acertos);
    const validos = [q, a].every((n) => Number.isInteger(n) && n >= 0) && questoes !== "" && acertos !== "";
    if (!validos) {
      setQuestoes(String(progresso.questoes));
      setAcertos(String(progresso.acertos));
      return;
    }
    if (q === progresso.questoes && a === progresso.acertos) return;
    void onSalvar(topico.id, { ...progresso, questoes: q, acertos: a }).then((salvou) => {
      if (salvou) return;
      setQuestoes(String(progresso.questoes));
      setAcertos(String(progresso.acertos));
    });
  }

  const campoNumero = `w-16 rounded-md border border-line bg-white px-2 py-1 text-center tabular-nums outline-none focus:border-accent disabled:opacity-60 ${focusRing}`;

  return (
    <tr className="border-t border-line" aria-busy={salvando}>
      <th
        scope="row"
        className="px-4 py-2 text-left font-normal text-ink/90"
        style={{ paddingLeft: `${1 + nivel * 1.25}rem` }}
      >
        {topico.nome}
      </th>
      {ETAPAS.map((etapa, indice) => {
        const data = datas[indice];
        const anteriorFeita = indice === 0 || datas[indice - 1] !== null;
        const proximaFeita = indice < ETAPAS.length - 1 && datas[indice + 1] !== null;
        const bloqueado = salvando || (data ? proximaFeita : !anteriorFeita);
        return (
          <td key={etapa.campo} className="px-2 py-2 text-center">
            <button
              type="button"
              onClick={() => alternar(indice)}
              disabled={bloqueado}
              aria-pressed={data !== null}
              aria-label={
                data
                  ? `${etapa.rotulo} de ${topico.nome} feita em ${diaMes(data)}. Desmarcar`
                  : `Marcar ${etapa.rotulo} de ${topico.nome} hoje`
              }
              className={`inline-flex h-7 min-w-[3.25rem] items-center justify-center gap-1 rounded-md border text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${
                data
                  ? "border-accent/30 bg-accent/10 font-medium text-accent-deep hover:bg-accent/15"
                  : "border-line bg-panel text-muted hover:border-accent/40 hover:text-ink"
              }`}
            >
              {data ? (
                <>
                  <NavIcon name="check" className="h-3.5 w-3.5" />
                  {diaMes(data)}
                </>
              ) : (
                <span aria-hidden="true">—</span>
              )}
            </button>
          </td>
        );
      })}
      <td className="px-2 py-2 text-center">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={questoes}
          disabled={salvando}
          aria-label={`Questões feitas em ${topico.nome}`}
          onChange={(event) => setQuestoes(event.target.value)}
          onBlur={salvarNumeros}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={campoNumero}
        />
      </td>
      <td className="px-2 py-2 text-center">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={acertos}
          disabled={salvando}
          aria-label={`Acertos em ${topico.nome}`}
          onChange={(event) => setAcertos(event.target.value)}
          onBlur={salvarNumeros}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={campoNumero}
        />
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-muted">{taxaTexto(topico.resumo.taxa)}</td>
    </tr>
  );
}
