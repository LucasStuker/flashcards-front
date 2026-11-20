"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { SessaoCinematica } from "@/components/estudo/SessaoCinematica";
import { alertaErro, botaoPrimario, botaoSecundario, focusRing, linkAcao } from "@/components/ui";
import { agendarAlarme, notificarEstudo, prepararAlarme } from "@/lib/alarme-estudo";
import {
  EditalOficial,
  EditalOficialResumo,
  Sessao,
  Topico,
  concluirSessao,
  descartarSessao,
  getEditalOficial,
  iniciarSessao,
  listEditaisOficiais,
  pausarSessao,
  retomarSessao,
  sessaoAberta,
} from "@/lib/api";
import {
  EstadoPomodoro,
  ModoPomodoro,
  OPCOES_POMODORO,
  avancarPomodoro,
  iniciarPomodoro,
  lerPomodoro,
  pausarPomodoro,
  restanteSegundos,
  retomarPomodoro,
  salvarPomodoro,
} from "@/lib/pomodoro";
import {
  OPCOES_RUIDO,
  TipoRuido,
  definirRuido,
  definirVolumeRuido,
  pararRuido,
} from "@/lib/ruido-estudo";

const campo = `w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink ${focusRing}`;
const rotulo = "flex flex-col gap-1 text-[13px] font-medium text-ink/80";

type Folha = { id: number; caminho: string };

function folhas(topicos: Topico[], prefixo = ""): Folha[] {
  return topicos.flatMap((topico) => {
    const caminho = prefixo ? `${prefixo} › ${topico.nome}` : topico.nome;
    if (topico.filhos.length === 0) return [{ id: topico.id, caminho }];
    return folhas(topico.filhos, caminho);
  });
}

function formatarTempo(segundos: number) {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function liquidoAgora(sessao: Sessao, agora: number) {
  if (!sessao.rodandoDesde) return sessao.liquidoSegundos;
  const inicio = Date.parse(sessao.rodandoDesde);
  if (Number.isNaN(inicio)) return sessao.liquidoSegundos;
  return sessao.liquidoSegundos + Math.max(0, Math.floor((agora - inicio) / 1000));
}

export default function EstudoPage() {
  const [inscritos, setInscritos] = useState<EditalOficialResumo[] | null>(null);
  const [editalId, setEditalId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<EditalOficial | null>(null);
  const [disciplina, setDisciplina] = useState("");
  const [topicoId, setTopicoId] = useState<number | "">("");
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [questoes, setQuestoes] = useState("0");
  const [acertos, setAcertos] = useState("0");
  const [concluindo, setConcluindo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editalConcluido, setEditalConcluido] = useState<number | null>(null);
  const [modoPomodoro, setModoPomodoro] = useState<ModoPomodoro>("25-5");
  const [pomodoro, setPomodoro] = useState<EstadoPomodoro | null>(null);
  const [faseAviso, setFaseAviso] = useState<string | null>(null);
  const [ruido, setRuido] = useState<TipoRuido>("rosa");
  const [volumeRuido, setVolumeRuido] = useState(0.45);
  const [cinematica, setCinematica] = useState(false);
  const cancelarAlarme = useRef<(() => void) | null>(null);

  function limparPomodoro() {
    cancelarAlarme.current?.();
    cancelarAlarme.current = null;
    setPomodoro(null);
    salvarPomodoro(null);
    setFaseAviso(null);
  }

  function encerrarAudioSessao() {
    limparPomodoro();
    pararRuido();
  }

  function aplicarPomodoro(proximo: EstadoPomodoro | null) {
    setPomodoro(proximo);
    salvarPomodoro(proximo);
    cancelarAlarme.current?.();
    cancelarAlarme.current = null;
    if (proximo?.terminaEm) {
      const seg = restanteSegundos(proximo.terminaEm, Date.now());
      cancelarAlarme.current = agendarAlarme(seg);
    }
  }

  useEffect(() => {
    let ativo = true;
    void Promise.all([listEditaisOficiais(), sessaoAberta()])
      .then(([editais, aberta]) => {
        if (!ativo) return;
        const lista = editais.filter((edital) => edital.inscrito);
        setInscritos(lista);
        setEditalId((atual) => atual ?? lista[0]?.id ?? null);
        setSessao(aberta);
        if (aberta) {
          setConcluindo(false);
          const salvo = lerPomodoro(aberta.id);
          if (salvo) {
            setPomodoro(salvo);
            if (salvo.terminaEm && aberta.rodandoDesde) {
              cancelarAlarme.current = agendarAlarme(
                restanteSegundos(salvo.terminaEm, Date.now()),
              );
            }
          }
        }
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar o estudo");
      });
    return () => {
      ativo = false;
      cancelarAlarme.current?.();
      pararRuido();
    };
  }, []);

  useEffect(() => {
    if (editalId === null) {
      setDetalhe(null);
      return;
    }
    let ativo = true;
    void getEditalOficial(editalId)
      .then((data) => {
        if (!ativo) return;
        setDetalhe(data);
        setDisciplina((atual) =>
          data.disciplinas.some((item) => item.nome === atual)
            ? atual
            : (data.disciplinas[0]?.nome ?? ""),
        );
        setTopicoId("");
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar o edital");
      });
    return () => {
      ativo = false;
    };
  }, [editalId]);

  useEffect(() => {
    if (!sessao) return;
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sessao]);

  useEffect(() => {
    if (!pomodoro?.terminaEm || !sessao?.rodandoDesde) return;
    if (restanteSegundos(pomodoro.terminaEm, agora) > 0) return;
    const faseAnterior = pomodoro.fase;
    const proximo = avancarPomodoro(pomodoro, agora);
    aplicarPomodoro(proximo);
    const msg =
      faseAnterior === "foco"
        ? "Foco terminou. Hora da pausa."
        : "Pausa terminou. Hora de focar de novo.";
    setFaseAviso(msg);
    notificarEstudo(
      faseAnterior === "foco" ? "Foco concluído" : "Pausa concluída",
      msg,
    );
  }, [agora, pomodoro, sessao]);

  const topicos = useMemo(() => {
    const materia = detalhe?.disciplinas.find((item) => item.nome === disciplina);
    return materia ? folhas(materia.topicos) : [];
  }, [detalhe, disciplina]);

  async function comAcao(acao: () => Promise<void>) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha na sessão");
    } finally {
      setOcupado(false);
    }
  }

  async function iniciar() {
    if (!disciplina) {
      setErro("Escolha a disciplina");
      return;
    }
    await comAcao(async () => {
      await prepararAlarme();
      const criada = await iniciarSessao({
        disciplina,
        ...(editalId !== null ? { editalId } : {}),
        ...(typeof topicoId === "number" ? { topicoId } : {}),
      });
      const agoraInicio = Date.now();
      setSessao(criada);
      setAgora(agoraInicio);
      setConcluindo(false);
      setQuestoes("0");
      setAcertos("0");
      setFaseAviso(null);
      if (modoPomodoro === "livre") limparPomodoro();
      else aplicarPomodoro(iniciarPomodoro(criada.id, modoPomodoro, agoraInicio));
      await definirRuido(ruido, volumeRuido);
    });
  }

  async function pausar() {
    if (!sessao) return;
    await comAcao(async () => {
      const agoraPausa = Date.now();
      setSessao(await pausarSessao(sessao.id));
      setAgora(agoraPausa);
      if (pomodoro) aplicarPomodoro(pausarPomodoro(pomodoro, agoraPausa));
    });
  }

  async function retomar() {
    if (!sessao) return;
    await comAcao(async () => {
      await prepararAlarme();
      const agoraRetomo = Date.now();
      setSessao(await retomarSessao(sessao.id));
      setAgora(agoraRetomo);
      if (pomodoro) aplicarPomodoro(retomarPomodoro(pomodoro, agoraRetomo));
      if (ruido !== "off") await definirRuido(ruido, volumeRuido);
    });
  }

  async function concluir() {
    if (!sessao) return;
    const q = Number(questoes);
    const a = Number(acertos);
    await comAcao(async () => {
      await concluirSessao(sessao.id, { questoes: q, acertos: a });
      encerrarAudioSessao();
      setCinematica(false);
      setSessao(null);
      setConcluindo(false);
      const tempo = formatarTempo(liquidoAgora(sessao, Date.now()));
      const noVerticalizado =
        sessao.editalId && sessao.topicoId && (q > 0 || a > 0)
          ? " Questões e acertos foram para o verticalizado."
          : sessao.editalId && !sessao.topicoId && (q > 0 || a > 0)
            ? " Sem tópico escolhido: o verticalizado não mudou."
            : "";
      setAviso(
        `Sessão de ${disciplina || sessao.disciplina} concluída (${tempo}).${noVerticalizado}`,
      );
      setEditalConcluido(sessao.editalId);
    });
  }

  async function descartar() {
    if (!sessao) return;
    if (!window.confirm("Descartar esta sessão? O tempo não conta no dashboard.")) return;
    await comAcao(async () => {
      await descartarSessao(sessao.id);
      encerrarAudioSessao();
      setCinematica(false);
      setSessao(null);
      setConcluindo(false);
    });
  }

  async function trocarRuido(proximo: TipoRuido) {
    setRuido(proximo);
    if (!sessao) return;
    await prepararAlarme();
    await definirRuido(proximo, volumeRuido);
  }

  function trocarVolume(valor: number) {
    setVolumeRuido(valor);
    definirVolumeRuido(valor);
  }

  const countdown =
    pomodoro == null
      ? null
      : pomodoro.terminaEm != null
        ? restanteSegundos(pomodoro.terminaEm, agora)
        : (pomodoro.restantePausado ?? 0);

  const semInscricao = inscritos !== null && inscritos.length === 0 && !sessao;

  return (
    <PageContainer>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Estudo</h1>
        <p className="max-w-2xl text-sm text-muted">
          Cronometre uma sessão numa disciplina do concurso em que você está inscrito. Ao concluir,
          o tempo e as questões entram no dashboard e no Desempenho.
        </p>
      </div>

      {erro ? (
        <p role="alert" className={alertaErro}>
          {erro}
        </p>
      ) : null}

      {aviso ? (
        <p role="status" className="rounded-lg border border-ok/25 bg-ok/5 px-3 py-2 text-sm text-ink">
          {aviso}{" "}
          <Link href="/desempenho" className={linkAcao}>
            Ver desempenho
          </Link>
          {editalConcluido ? (
            <>
              {" · "}
              <Link
                href={`/verticalizado?edital=${editalConcluido}`}
                className={linkAcao}
              >
                Ver verticalizado
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {inscritos === null && !erro ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {semInscricao ? (
        <Bloco id="estudo-vazio" titulo="Sem concurso">
          <EstadoVazio
            icone="target"
            titulo="Inscreva-se em um edital para estudar"
            texto="A sessão usa as disciplinas do concurso. Escolha um edital disponível e volte aqui."
            acao={
              <Link href="/editais" className={botaoPrimario}>
                Ver editais
              </Link>
            }
          />
        </Bloco>
      ) : null}

      {sessao ? (
        <>
          <Bloco
            id="sessao-aberta"
            titulo="Sessão em andamento"
            acao={
              <span className="text-[13px] text-muted" aria-live="polite">
                {sessao.rodandoDesde ? "Rodando" : "Pausada"}
                {pomodoro
                  ? ` · ${pomodoro.fase === "foco" ? "Foco" : "Pausa"} ${pomodoro.modo}`
                  : ""}
              </span>
            }
          >
            <div className="flex flex-col gap-4 px-4 py-5">
              <div>
                <p className="text-sm font-medium text-ink">{sessao.disciplina}</p>
                {countdown !== null ? (
                  <>
                    <p className="mt-1 text-[13px] text-muted">
                      {pomodoro?.fase === "foco" ? "Tempo de foco" : "Tempo de pausa"}
                    </p>
                    <p
                      className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink tabular-nums"
                      aria-live="polite"
                    >
                      {formatarTempo(countdown)}
                    </p>
                    <p className="mt-2 text-[13px] text-muted">
                      Tempo líquido da sessão:{" "}
                      <span className="tabular-nums text-ink">
                        {formatarTempo(liquidoAgora(sessao, agora))}
                      </span>
                    </p>
                  </>
                ) : (
                  <p
                    className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink tabular-nums"
                    aria-live="polite"
                  >
                    {formatarTempo(liquidoAgora(sessao, agora))}
                  </p>
                )}
              </div>

              {faseAviso ? (
                <p
                  role="status"
                  className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-sm text-ink"
                >
                  {faseAviso}
                </p>
              ) : null}

              <div className="flex max-w-md flex-col gap-2">
                <label className={rotulo}>
                  Ruído ambiente
                  <select
                    className={campo}
                    value={ruido}
                    onChange={(e) => void trocarRuido(e.target.value as TipoRuido)}
                  >
                    {OPCOES_RUIDO.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.titulo}
                      </option>
                    ))}
                  </select>
                </label>
                {ruido !== "off" ? (
                  <label className={rotulo}>
                    Volume
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volumeRuido}
                      onChange={(e) => trocarVolume(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                      aria-valuetext={`${Math.round(volumeRuido * 100)}%`}
                    />
                  </label>
                ) : null}
              </div>

              {!concluindo ? (
                <div className="flex flex-wrap gap-2">
                  {sessao.rodandoDesde ? (
                    <button
                      type="button"
                      className={botaoSecundario}
                      disabled={ocupado}
                      onClick={() => void pausar()}
                    >
                      Pausar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={botaoPrimario}
                      disabled={ocupado}
                      onClick={() => void retomar()}
                    >
                      Retomar
                    </button>
                  )}
                  <button
                    type="button"
                    className={botaoPrimario}
                    disabled={ocupado}
                    onClick={() => setConcluindo(true)}
                  >
                    Concluir
                  </button>
                  <button
                    type="button"
                    className={botaoSecundario}
                    disabled={ocupado}
                    onClick={() => setCinematica(true)}
                  >
                    Modo cinema
                  </button>
                  <button
                    type="button"
                    className={`text-sm font-medium text-bad hover:underline ${focusRing}`}
                    disabled={ocupado}
                    onClick={() => void descartar()}
                  >
                    Descartar
                  </button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-3 sm:max-w-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void concluir();
                  }}
                >
                  <p className="text-sm text-muted">
                    Lance as questões feitas nesta sessão. Com tópico escolhido, o número soma no
                    verticalizado. Pode deixar 0 se só estudou teoria.
                  </p>
                  <label className={rotulo}>
                    Questões
                    <input
                      className={campo}
                      inputMode="numeric"
                      value={questoes}
                      onChange={(e) => setQuestoes(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                  <label className={rotulo}>
                    Acertos
                    <input
                      className={campo}
                      inputMode="numeric"
                      value={acertos}
                      onChange={(e) => setAcertos(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={botaoPrimario} disabled={ocupado}>
                      {ocupado ? "Salvando…" : "Salvar sessão"}
                    </button>
                    <button
                      type="button"
                      className={botaoSecundario}
                      disabled={ocupado}
                      onClick={() => setConcluindo(false)}
                    >
                      Voltar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Bloco>

          {cinematica ? (
            <SessaoCinematica
              disciplina={sessao.disciplina}
              tempoPrincipal={formatarTempo(
                countdown !== null ? countdown : liquidoAgora(sessao, agora),
              )}
              tempoLiquido={formatarTempo(liquidoAgora(sessao, agora))}
              rotuloFase={
                pomodoro
                  ? `${pomodoro.fase === "foco" ? "Foco" : "Pausa"} · ${pomodoro.modo}`
                  : null
              }
              status={sessao.rodandoDesde ? "Rodando" : "Pausada"}
              faseAviso={faseAviso}
              ruido={ruido}
              volumeRuido={volumeRuido}
              concluindo={concluindo}
              questoes={questoes}
              acertos={acertos}
              ocupado={ocupado}
              onPausar={() => void pausar()}
              onRetomar={() => void retomar()}
              onConcluirPedido={() => setConcluindo(true)}
              onConcluirSalvar={() => void concluir()}
              onConcluirVoltar={() => setConcluindo(false)}
              onDescartar={() => void descartar()}
              onRuido={(tipo) => void trocarRuido(tipo)}
              onVolume={trocarVolume}
              onQuestoes={setQuestoes}
              onAcertos={setAcertos}
              onFechar={() => setCinematica(false)}
            />
          ) : null}
        </>
      ) : null}

      {!sessao && inscritos && inscritos.length > 0 ? (
        <Bloco id="nova-sessao" titulo="Nova sessão">
          <form
            className="flex flex-col gap-4 px-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              void iniciar();
            }}
          >
            {inscritos.length > 1 ? (
              <label className={`max-w-xl ${rotulo}`}>
                Concurso
                <select
                  className={campo}
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
            ) : (
              <p className="text-sm text-ink/80">
                {inscritos[0].area
                  ? `${inscritos[0].cargo} · ${inscritos[0].area}`
                  : inscritos[0].cargo}
              </p>
            )}

            <label className={`max-w-xl ${rotulo}`}>
              Disciplina
              <select
                className={campo}
                value={disciplina}
                onChange={(e) => {
                  setDisciplina(e.target.value);
                  setTopicoId("");
                }}
                disabled={!detalhe}
              >
                {(detalhe?.disciplinas ?? []).map((item) => (
                  <option key={item.id} value={item.nome}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="flex max-w-xl flex-col gap-2">
              <legend className="text-[13px] font-medium text-ink/80">Ritmo</legend>
              <p className="text-[13px] text-muted">
                No fim do foco ou da pausa tocamos um bipe e, se você autorizar, o sistema avisa
                fora da aba.
              </p>
              <div role="radiogroup" aria-label="Ritmo da sessão" className="flex flex-col gap-1.5">
                {OPCOES_POMODORO.map((opcao) => {
                  const marcado = modoPomodoro === opcao.valor;
                  return (
                    <label
                      key={opcao.valor}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        marcado
                          ? "border-accent/40 bg-accent/5"
                          : "border-line bg-panel hover:bg-paper"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ritmo-sessao"
                        className="mt-1 shrink-0 accent-[var(--accent)]"
                        checked={marcado}
                        onChange={() => setModoPomodoro(opcao.valor)}
                      />
                      <span className="min-w-0 leading-snug">
                        <span className="font-medium text-ink">{opcao.titulo}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">{opcao.texto}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex max-w-xl flex-col gap-2">
              <legend className="text-[13px] font-medium text-ink/80">Ruído ambiente</legend>
              <p className="text-[13px] text-muted">
                Gerado no browser, sem arquivo externo. Pode mudar o volume depois de iniciar.
              </p>
              <div
                role="radiogroup"
                aria-label="Ruído ambiente"
                className="flex flex-col gap-1.5"
              >
                {OPCOES_RUIDO.map((opcao) => {
                  const marcado = ruido === opcao.valor;
                  return (
                    <label
                      key={opcao.valor}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        marcado
                          ? "border-accent/40 bg-accent/5"
                          : "border-line bg-panel hover:bg-paper"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ruido-sessao"
                        className="mt-1 shrink-0 accent-[var(--accent)]"
                        checked={marcado}
                        onChange={() => setRuido(opcao.valor)}
                      />
                      <span className="min-w-0 leading-snug">
                        <span className="font-medium text-ink">{opcao.titulo}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">{opcao.texto}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {ruido !== "off" ? (
                <label className={`max-w-sm ${rotulo}`}>
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volumeRuido}
                    onChange={(e) => setVolumeRuido(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                    aria-valuetext={`${Math.round(volumeRuido * 100)}%`}
                  />
                </label>
              ) : null}
            </fieldset>

            <fieldset className="flex flex-col gap-2" disabled={!detalhe || topicos.length === 0}>
              <legend className="text-[13px] font-medium text-ink/80">Tópico (opcional)</legend>
              <p className="text-[13px] text-muted">
                Escolha um tópico para as questões irem ao verticalizado. “Toda a disciplina”
                só conta no dashboard.
              </p>
              <div
                role="radiogroup"
                aria-label="Tópico da sessão"
                className="max-h-72 overflow-y-auto rounded-lg border border-line bg-panel"
              >
                <label
                  className={`flex cursor-pointer items-start gap-2.5 border-b border-line px-3 py-2.5 text-sm transition-colors hover:bg-paper ${
                    topicoId === "" ? "bg-accent/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="topico-sessao"
                    className="mt-1 shrink-0 accent-[var(--accent)]"
                    checked={topicoId === ""}
                    onChange={() => setTopicoId("")}
                  />
                  <span className="min-w-0 leading-snug text-ink">
                    <span className="font-medium">Toda a disciplina</span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      Conta o tempo só no nome da disciplina
                    </span>
                  </span>
                </label>
                {topicos.map((topico) => {
                  const partes = topico.caminho.split(" › ");
                  const nome = partes[partes.length - 1] ?? topico.caminho;
                  const pais = partes.slice(0, -1).join(" › ");
                  const marcado = topicoId === topico.id;
                  return (
                    <label
                      key={topico.id}
                      className={`flex cursor-pointer items-start gap-2.5 border-b border-line px-3 py-2.5 text-sm last:border-0 transition-colors hover:bg-paper ${
                        marcado ? "bg-accent/5" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="topico-sessao"
                        className="mt-1 shrink-0 accent-[var(--accent)]"
                        checked={marcado}
                        onChange={() => setTopicoId(topico.id)}
                      />
                      <span className="min-w-0 leading-snug text-ink">
                        {pais ? (
                          <span className="mb-0.5 block break-words text-[12px] text-muted">
                            {pais}
                          </span>
                        ) : null}
                        <span className="block break-words">{nome}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="submit"
              className={`w-fit ${botaoPrimario}`}
              disabled={ocupado || !disciplina}
            >
              {ocupado ? "Abrindo…" : "Iniciar sessão"}
            </button>
          </form>
        </Bloco>
      ) : null}
    </PageContainer>
  );
}
