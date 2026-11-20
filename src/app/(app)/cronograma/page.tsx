"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CronogramaToolbar, Visao } from "@/components/cronograma/CronogramaToolbar";
import { AutoavaliacaoPainel } from "@/components/cronograma/AutoavaliacaoPainel";
import { DisponibilidadePainel } from "@/components/cronograma/DisponibilidadePainel";
import { MateriasPainel } from "@/components/cronograma/MateriasPainel";
import { PlanoPainel } from "@/components/cronograma/PlanoPainel";
import { VisaoMes } from "@/components/cronograma/VisaoMes";
import { VisaoSemana } from "@/components/cronograma/VisaoSemana";
import {
  diasDaSemana,
  gradeDoMes,
  hoje,
  inicioDaSemana,
  paraData,
  paraDia,
  somarDias,
  tituloDaSemana,
  tituloDoMes,
} from "@/components/cronograma/datas";
import { Arrasto, useCronograma } from "@/components/cronograma/useCronograma";
import { PageContainer } from "@/components/PageContainer";
import { alertaErro, botaoPrimario, focusRing, linkAcao } from "@/components/ui";
import { EditalOficialResumo, listEditaisOficiais } from "@/lib/api";

function somarMeses(dia: string, meses: number) {
  const data = paraData(dia);
  return paraDia(new Date(data.getFullYear(), data.getMonth() + meses, 1));
}

export default function CronogramaPage() {
  const [visao, setVisao] = useState<Visao>("semana");
  const [referencia, setReferencia] = useState(hoje);
  const [materiaSelecionada, setMateriaSelecionada] = useState<string | null>(null);
  const [blocoSelecionado, setBlocoSelecionado] = useState<string | null>(null);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [inscritos, setInscritos] = useState<EditalOficialResumo[] | null>(null);
  const [editalId, setEditalId] = useState<number | null>(null);

  const dias = useMemo(
    () => (visao === "semana" ? diasDaSemana(referencia) : gradeDoMes(referencia)),
    [visao, referencia],
  );
  const segunda = inicioDaSemana(referencia);
  const {
    materias,
    porId,
    blocos,
    carregando,
    gerando,
    erro,
    criar,
    atualizar,
    remover,
    gerar,
    recarregar,
  } = useCronograma(dias[0], dias[dias.length - 1], editalId);

  const blocosDoPeriodo = useMemo(() => {
    if (visao === "semana") return blocos;
    const mes = referencia.slice(0, 7);
    return blocos.filter((b) => b.dia.startsWith(mes));
  }, [blocos, visao, referencia]);

  const bloco = blocos.find((b) => b.id === blocoSelecionado) ?? null;

  useEffect(() => {
    void listEditaisOficiais()
      .then((lista) => {
        const insc = lista.filter((e) => e.inscrito);
        setInscritos(insc);
        setEditalId((atual) => atual ?? insc[0]?.id ?? null);
      })
      .catch(() => setInscritos([]));
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setMateriaSelecionada(null);
      setBlocoSelecionado(null);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  function navegar(direcao: 1 | -1) {
    setReferencia((atual) => (visao === "semana" ? somarDias(atual, 7 * direcao) : somarMeses(atual, direcao)));
  }

  function abrirSemana(dia: string) {
    setReferencia(dia);
    setVisao("semana");
  }

  function removerSelecionado(id: string) {
    void remover(id);
    setBlocoSelecionado(null);
  }

  const semInscricao = inscritos !== null && inscritos.length === 0;

  return (
    <PageContainer maxWidth="wide">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Cronograma</h1>
          <p className="mt-0.5 max-w-2xl text-[13px] text-muted">
            Monte um plano até a prova (estratégia com IA), encaixado nos seus horários livres. Ajuste
            depois arrastando os blocos.
          </p>
        </div>
        <button
          type="button"
          className={botaoPrimario}
          disabled={gerando || semInscricao || editalId == null}
          onClick={() => {
            setBlocoSelecionado(null);
            void gerar(segunda);
          }}
          title="Regenera só a semana visível (usa pesos do plano, se houver)"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {gerando ? "Gerando…" : "Regenerar semana"}
        </button>
      </header>

      {erro ? <p className={alertaErro}>{erro}</p> : null}

      {semInscricao ? (
        <p className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink">
          Inscreva-se em um edital para montar o cronograma.{" "}
          <Link href="/editais" className={linkAcao}>
            Ver editais
          </Link>
        </p>
      ) : null}

      {inscritos && inscritos.length > 1 ? (
        <label className="flex max-w-md flex-col gap-1 text-[13px] font-medium text-ink/80">
          Concurso
          <select
            className={`rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink ${focusRing}`}
            value={editalId ?? ""}
            onChange={(e) => setEditalId(Number(e.target.value))}
          >
            {inscritos.map((edital) => (
              <option key={edital.id} value={edital.id}>
                {edital.area ? `${edital.cargo} · ${edital.area}` : edital.cargo}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <DisponibilidadePainel />
        <AutoavaliacaoPainel editalId={editalId} disabled={semInscricao} />
      </div>

      <PlanoPainel
        editalId={editalId}
        segunda={segunda}
        disabled={semInscricao}
        onGerado={(segundaInicio) => {
          setBlocoSelecionado(null);
          setReferencia(segundaInicio);
          setVisao("semana");
          void recarregar();
        }}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <MateriasPainel
          materias={materias}
          blocos={blocosDoPeriodo}
          materiaSelecionada={materiaSelecionada}
          onSelecionarMateria={setMateriaSelecionada}
          onArrasto={setArrasto}
          bloco={bloco}
          onAtualizar={atualizar}
          onRemover={removerSelecionado}
          onFecharBloco={() => setBlocoSelecionado(null)}
          rotuloPeriodo={visao === "semana" ? "nesta semana" : "neste mês"}
        />

        <div className="flex min-w-0 flex-col gap-3">
          <CronogramaToolbar
            titulo={visao === "semana" ? tituloDaSemana(referencia) : tituloDoMes(referencia)}
            visao={visao}
            onVisao={setVisao}
            onAnterior={() => navegar(-1)}
            onProximo={() => navegar(1)}
            onHoje={() => setReferencia(hoje())}
          />

          {carregando ? (
            <div className="h-[32rem] animate-pulse rounded-xl border border-line bg-panel" aria-label="Carregando" />
          ) : visao === "semana" ? (
            <VisaoSemana
              dias={dias}
              blocos={blocos}
              porId={porId}
              materiaSelecionada={materiaSelecionada}
              blocoSelecionado={blocoSelecionado}
              arrasto={arrasto}
              onArrasto={setArrasto}
              onCriar={(novo) => void criar(novo)}
              onAtualizar={(id, mudancas) => void atualizar(id, mudancas)}
              onSelecionarBloco={setBlocoSelecionado}
            />
          ) : (
            <VisaoMes
              referencia={referencia}
              dias={dias}
              blocos={blocos}
              porId={porId}
              materiaSelecionada={materiaSelecionada}
              blocoSelecionado={blocoSelecionado}
              arrasto={arrasto}
              onArrasto={setArrasto}
              onCriar={(novo) => void criar(novo)}
              onAtualizar={(id, mudancas) => void atualizar(id, mudancas)}
              onSelecionarBloco={setBlocoSelecionado}
              onAbrirSemana={abrirSemana}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
