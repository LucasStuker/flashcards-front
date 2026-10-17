"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CronogramaToolbar, Visao } from "@/components/cronograma/CronogramaToolbar";
import { MateriasPainel } from "@/components/cronograma/MateriasPainel";
import { VisaoMes } from "@/components/cronograma/VisaoMes";
import { VisaoSemana } from "@/components/cronograma/VisaoSemana";
import {
  diasDaSemana,
  gradeDoMes,
  hoje,
  paraData,
  paraDia,
  somarDias,
  tituloDaSemana,
  tituloDoMes,
} from "@/components/cronograma/datas";
import { Arrasto, useCronograma } from "@/components/cronograma/useCronograma";
import { PageContainer } from "@/components/PageContainer";
import { alertaErro, focusRing } from "@/components/ui";

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

  const dias = useMemo(
    () => (visao === "semana" ? diasDaSemana(referencia) : gradeDoMes(referencia)),
    [visao, referencia],
  );
  const { materias, porId, blocos, carregando, erro, criar, atualizar, remover, restaurar } = useCronograma(
    dias[0],
    dias[dias.length - 1],
  );

  const blocosDoPeriodo = useMemo(() => {
    if (visao === "semana") return blocos;
    const mes = referencia.slice(0, 7);
    return blocos.filter((b) => b.dia.startsWith(mes));
  }, [blocos, visao, referencia]);

  const bloco = blocos.find((b) => b.id === blocoSelecionado) ?? null;

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

  return (
    <PageContainer maxWidth="wide">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Cronograma</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Distribua as matérias na semana. Arraste um bloco para mudar o horário e puxe a borda de baixo para mudar a
            duração.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <span>Dados de exemplo, salvos só neste navegador.</span>
          <button
            type="button"
            onClick={() => {
              setBlocoSelecionado(null);
              void restaurar();
            }}
            className={`inline-flex items-center gap-1 font-medium text-accent hover:text-accent-deep ${focusRing}`}
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Restaurar exemplo
          </button>
        </div>
      </header>

      {erro ? <p className={alertaErro}>{erro}</p> : null}

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
