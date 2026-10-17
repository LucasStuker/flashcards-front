"use client";

import { useEffect, useState } from "react";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { GraficoBarras, GraficoRadar, Legenda } from "@/components/desempenho/GraficoDisciplinas";
import { GraficoSemana } from "@/components/desempenho/GraficoSemana";
import { TabelaDisciplinas } from "@/components/desempenho/TabelaDisciplinas";
import { Metrica, diaCurto, metricas } from "@/components/desempenho/formato";
import { PageContainer } from "@/components/PageContainer";
import { alertaErro, focusRing } from "@/components/ui";
import {
  DesempenhoDisciplinas,
  DesempenhoSemana,
  PeriodoDesempenho,
  getDesempenhoDisciplinas,
  getDesempenhoSemana,
} from "@/lib/api";

const RADAR_MINIMO = 3;
const periodos: PeriodoDesempenho[] = [7, 30, 90];

const seletor = `rounded-md border border-line bg-panel px-2 py-1 text-[13px] text-ink ${focusRing}`;

function useCarregar<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    carregar()
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setErro(null);
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { dados, erro, carregando };
}

export default function DesempenhoPage() {
  const [semanaDia, setSemanaDia] = useState<string | undefined>(undefined);
  const [metrica, setMetrica] = useState<Metrica>("tempo");
  const [periodo, setPeriodo] = useState<PeriodoDesempenho>(30);
  const [modo, setModo] = useState<"radar" | "barras">("radar");

  const semana = useCarregar<DesempenhoSemana>(() => getDesempenhoSemana(semanaDia), [semanaDia]);
  const porDisciplina = useCarregar<DesempenhoDisciplinas>(
    () => getDesempenhoDisciplinas(periodo),
    [periodo],
  );

  const disciplinas = porDisciplina.dados?.disciplinas ?? [];
  const radarPossivel = disciplinas.length >= RADAR_MINIMO;
  const modoEfetivo = radarPossivel ? modo : "barras";

  return (
    <PageContainer maxWidth="wide">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Desempenho</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          Quanto você estudou e onde está acertando, por dia e por disciplina.
        </p>
      </header>

      <Bloco
        id="semana-heading"
        titulo="Semana"
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="semana-select">
              Semana
            </label>
            <select
              id="semana-select"
              className={seletor}
              value={semana.dados?.semana.inicio ?? ""}
              onChange={(e) => setSemanaDia(e.target.value)}
              disabled={!semana.dados}
            >
              {(semana.dados?.semanas ?? []).map((s) => (
                <option key={s.inicio} value={s.inicio}>
                  Semana {s.numero} · {diaCurto(s.inicio)} a {diaCurto(s.fim)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="metrica-select">
              Métrica
            </label>
            <select
              id="metrica-select"
              className={seletor}
              value={metrica}
              onChange={(e) => setMetrica(e.target.value as Metrica)}
            >
              {metricas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className={`px-4 py-4 transition-opacity ${semana.carregando && semana.dados ? "opacity-60" : ""}`}>
          {semana.erro ? (
            <p role="alert" className={alertaErro}>
              {semana.erro}
            </p>
          ) : semana.dados ? (
            <GraficoSemana dados={semana.dados} metrica={metrica} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Carregando…</p>
          )}
        </div>
      </Bloco>

      <Bloco
        id="disciplinas-heading"
        titulo="Por disciplina"
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="periodo-select">
              Período
            </label>
            <select
              id="periodo-select"
              className={seletor}
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value) as PeriodoDesempenho)}
            >
              {periodos.map((p) => (
                <option key={p} value={p}>
                  Últimos {p} dias
                </option>
              ))}
            </select>
            <div role="group" aria-label="Tipo de gráfico" className="flex rounded-md border border-line p-0.5">
              {(["radar", "barras"] as const).map((opcao) => {
                const desabilitado = opcao === "radar" && !radarPossivel;
                return (
                  <button
                    key={opcao}
                    type="button"
                    aria-pressed={modoEfetivo === opcao}
                    disabled={desabilitado}
                    title={desabilitado ? "Radar a partir de 3 disciplinas" : undefined}
                    onClick={() => setModo(opcao)}
                    className={`rounded px-2.5 py-0.5 text-[13px] ${focusRing} ${
                      modoEfetivo === opcao ? "bg-paper font-medium text-ink" : "text-muted hover:text-ink"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {opcao === "radar" ? "Radar" : "Barras"}
                  </button>
                );
              })}
            </div>
          </div>
        }
      >
        <div className={`transition-opacity ${porDisciplina.carregando && porDisciplina.dados ? "opacity-60" : ""}`}>
          {porDisciplina.erro ? (
            <p role="alert" className={`m-4 ${alertaErro}`}>
              {porDisciplina.erro}
            </p>
          ) : !porDisciplina.dados ? (
            <p className="py-10 text-center text-sm text-muted">Carregando…</p>
          ) : disciplinas.length === 0 ? (
            <EstadoVazio
              icone="folder"
              titulo={`Nenhuma disciplina com estudo nos últimos ${periodo} dias`}
              texto="Ligue um deck a uma disciplina em Decks → Editar, ou conclua uma sessão de estudo."
            />
          ) : (
            <>
              <div className="flex flex-col gap-4 px-4 py-4">
                <Legenda />
                {!radarPossivel ? (
                  <p className="text-[12px] text-muted">Radar a partir de 3 disciplinas.</p>
                ) : null}
                {modoEfetivo === "radar" ? (
                  <GraficoRadar disciplinas={disciplinas} />
                ) : (
                  <GraficoBarras disciplinas={disciplinas} />
                )}
              </div>
              <TabelaDisciplinas dados={porDisciplina.dados} />
            </>
          )}
        </div>
      </Bloco>
    </PageContainer>
  );
}
