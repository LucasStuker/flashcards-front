"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NavIcon } from "@/components/NavIcon";
import { PageContainer } from "@/components/PageContainer";
import { ArvoreEditavel } from "@/components/editais/ArvoreEditavel";
import { StatusImportacaoTag } from "@/components/editais/StatusImportacaoTag";
import { alertaErro, botaoPrimario, botaoSecundario, focusRing, linkAcao } from "@/components/ui";
import {
  DisciplinaExtraida,
  DisciplinaResumo,
  ImportacaoDetalhe,
  RascunhoEdital,
  descartarImportacao,
  getImportacao,
  listDisciplinas,
  publicarImportacao,
  salvarRascunhoEdital,
} from "@/lib/api";

const campo = `w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink ${focusRing}`;
const rotuloCampo = "flex flex-col gap-1 text-[13px] font-medium text-ink/80";

const CASAR_AUTOMATICO = "auto";
const CASAR_NOVA = "nova";

function valorCasar(disciplina: DisciplinaExtraida) {
  if (disciplina.casarCom === undefined) return CASAR_AUTOMATICO;
  if (disciplina.casarCom === null) return CASAR_NOVA;
  return String(disciplina.casarCom);
}

function comCasar(disciplina: DisciplinaExtraida, valor: string): DisciplinaExtraida {
  const resto = { nome: disciplina.nome, topicos: disciplina.topicos };
  if (valor === CASAR_AUTOMATICO) return resto;
  return { ...resto, casarCom: valor === CASAR_NOVA ? null : Number(valor) };
}

export default function RevisarImportacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [detalhe, setDetalhe] = useState<ImportacaoDetalhe | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoEdital | null>(null);
  const [catalogo, setCatalogo] = useState<DisciplinaResumo[]>([]);
  const [cargo, setCargo] = useState(0);
  const [pendente, setPendente] = useState(false);
  const [ocupado, setOcupado] = useState<"salvar" | "publicar" | "descartar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; editalId: number } | null>(null);

  const aplicar = useCallback((dados: ImportacaoDetalhe) => {
    setDetalhe(dados);
    setRascunho(dados.rascunho);
    setPendente(false);
    setCargo((atual) => Math.min(atual, Math.max((dados.rascunho?.cargos.length ?? 1) - 1, 0)));
  }, []);

  useEffect(() => {
    if (!Number.isInteger(id)) {
      setErro("Importação não encontrada");
      return;
    }
    let ativo = true;
    void Promise.all([getImportacao(id), listDisciplinas()])
      .then(([dados, disciplinas]) => {
        if (!ativo) return;
        aplicar(dados);
        setCatalogo(disciplinas);
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar importação");
      });
    return () => {
      ativo = false;
    };
  }, [id, aplicar]);

  useEffect(() => {
    if (!pendente) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [pendente]);

  function editar(mudar: (atual: RascunhoEdital) => RascunhoEdital) {
    setRascunho((atual) => (atual ? mudar(atual) : atual));
    setPendente(true);
    setAviso(null);
  }

  function editarDisciplinas(mudar: (disciplinas: DisciplinaExtraida[]) => DisciplinaExtraida[]) {
    editar((atual) => ({
      ...atual,
      cargos: atual.cargos.map((item, i) =>
        i === cargo ? { ...item, disciplinas: mudar(item.disciplinas) } : item,
      ),
    }));
  }

  async function salvar(): Promise<boolean> {
    if (!rascunho) return false;
    setOcupado("salvar");
    setErro(null);
    try {
      aplicar(await salvarRascunhoEdital(id, rascunho));
      return true;
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
      return false;
    } finally {
      setOcupado(null);
    }
  }

  async function publicar() {
    if (!rascunho) return;
    const atual = rascunho.cargos[cargo];
    if (!window.confirm(`Publicar o edital de ${atual.cargo || "cargo sem nome"} para os alunos?`))
      return;
    if (pendente && !(await salvar())) return;
    setOcupado("publicar");
    setErro(null);
    try {
      const { editalId } = await publicarImportacao(id, cargo);
      aplicar(await getImportacao(id));
      setCatalogo(await listDisciplinas());
      setAviso({ texto: `${atual.cargo} publicado.`, editalId });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao publicar");
    } finally {
      setOcupado(null);
    }
  }

  async function descartar() {
    if (!window.confirm("Descartar esta importação? O rascunho será apagado.")) return;
    setOcupado("descartar");
    try {
      await descartarImportacao(id);
      router.push("/editais/importar");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao descartar");
      setOcupado(null);
    }
  }

  const cargoAtual = rascunho?.cargos[cargo];
  const conferencia = pendente ? undefined : detalhe?.cargos[cargo];
  const editavel = detalhe?.status === "rascunho" && !!rascunho;

  return (
    <PageContainer>
      <Link href="/editais/importar" className={`w-fit text-sm ${linkAcao}`}>
        ← Importar editais
      </Link>

      {!detalhe && !erro ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {detalhe ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Revisar edital
            </h1>
            <StatusImportacaoTag status={detalhe.status} />
          </div>
          <p className="text-sm text-muted">
            {detalhe.arquivo}
            {detalhe.nota ? ` · ${detalhe.nota}` : ""}
          </p>
        </div>
      ) : null}

      {aviso ? (
        <p
          role="status"
          className="rounded-lg border border-ok/25 bg-ok/5 px-3 py-2 text-sm text-ink"
        >
          {aviso.texto}{" "}
          <Link href={`/editais/oficiais/${aviso.editalId}`} className={linkAcao}>
            Ver edital
          </Link>
        </p>
      ) : null}

      {detalhe && detalhe.status === "publicado" && !aviso ? (
        <p className="text-sm text-ink/80">
          Todos os cargos deste arquivo já foram publicados.{" "}
          {detalhe.editalId ? (
            <Link href={`/editais/oficiais/${detalhe.editalId}`} className={linkAcao}>
              Ver o último edital publicado
            </Link>
          ) : null}
        </p>
      ) : null}

      {detalhe && detalhe.status !== "rascunho" && detalhe.status !== "publicado" ? (
        <p className="text-sm text-ink/80">Esta importação não tem rascunho para revisar.</p>
      ) : null}

      {editavel && cargoAtual ? (
        <>
          <fieldset className="grid gap-3 sm:grid-cols-[2fr_1fr_7rem]">
            <legend className="sr-only">Dados do edital</legend>
            <label className={rotuloCampo}>
              Órgão
              <input
                className={campo}
                value={rascunho.orgao}
                onChange={(e) => editar((atual) => ({ ...atual, orgao: e.target.value }))}
              />
            </label>
            <label className={rotuloCampo}>
              Banca
              <input
                className={campo}
                value={rascunho.banca}
                onChange={(e) => editar((atual) => ({ ...atual, banca: e.target.value }))}
              />
            </label>
            <label className={rotuloCampo}>
              Ano
              <input
                className={campo}
                inputMode="numeric"
                value={rascunho.ano ?? ""}
                onChange={(e) => {
                  const ano = e.target.value.replace(/\D/g, "").slice(0, 4);
                  editar((atual) => ({ ...atual, ano: ano ? Number(ano) : null }));
                }}
              />
            </label>
          </fieldset>

          <section aria-labelledby="cargo-heading" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <h2 id="cargo-heading" className="sr-only">
                Cargo
              </h2>
              {rascunho.cargos.length > 1 ? (
                <label className={rotuloCampo}>
                  Cargo em revisão
                  <select
                    className={campo}
                    value={cargo}
                    onChange={(e) => setCargo(Number(e.target.value))}
                  >
                    {rascunho.cargos.map((item, i) => (
                      <option key={i} value={i}>
                        {item.cargo || `Cargo ${i + 1}`}
                        {item.area ? ` · ${item.area}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className={`min-w-48 flex-1 ${rotuloCampo}`}>
                Cargo
                <input
                  className={campo}
                  value={cargoAtual.cargo}
                  placeholder="Ex.: Auditor Fiscal da Receita Estadual"
                  onChange={(e) =>
                    editar((atual) => ({
                      ...atual,
                      cargos: atual.cargos.map((item, i) =>
                        i === cargo ? { ...item, cargo: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
              <label className={`min-w-40 flex-1 ${rotuloCampo}`}>
                Área (opcional)
                <input
                  className={campo}
                  value={cargoAtual.area ?? ""}
                  onChange={(e) =>
                    editar((atual) => ({
                      ...atual,
                      cargos: atual.cargos.map((item, i) =>
                        i === cargo ? { ...item, area: e.target.value || null } : item,
                      ),
                    }))
                  }
                />
              </label>
            </div>

            <Conferencia conferencia={conferencia} pendente={pendente} />
          </section>

          <section aria-label="Disciplinas e tópicos" className="flex flex-col gap-3">
            {cargoAtual.disciplinas.map((disciplina, indice) => {
              const previa = conferencia?.previa.disciplinas[indice];
              return (
                <details
                  key={indice}
                  open={cargoAtual.disciplinas.length <= 3}
                  className="group rounded-xl border border-line bg-panel shadow-card"
                >
                  <summary
                    className={`flex cursor-pointer list-none items-center gap-2 px-4 py-3 ${focusRing}`}
                  >
                    <NavIcon
                      name="chevron-right"
                      className="h-4 w-4 text-muted transition-transform group-open:rotate-90"
                    />
                    <span className="flex-1 text-sm font-semibold text-ink">
                      {disciplina.nome || "Disciplina sem nome"}
                    </span>
                    <span className="text-[13px] text-muted">
                      {previa
                        ? previa.disciplinaId !== null
                          ? `no catálogo: ${previa.disciplinaNome}`
                          : "disciplina nova"
                        : null}
                    </span>
                  </summary>
                  <div className="flex flex-col gap-3 border-t border-line px-4 py-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className={`min-w-48 flex-1 ${rotuloCampo}`}>
                        Nome no edital
                        <input
                          className={campo}
                          value={disciplina.nome}
                          onChange={(e) =>
                            editarDisciplinas((lista) =>
                              lista.map((item, i) =>
                                i === indice ? { ...item, nome: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className={`min-w-48 flex-1 ${rotuloCampo}`}>
                        Disciplina do catálogo
                        <select
                          className={campo}
                          value={valorCasar(disciplina)}
                          onChange={(e) =>
                            editarDisciplinas((lista) =>
                              lista.map((item, i) =>
                                i === indice ? comCasar(item, e.target.value) : item,
                              ),
                            )
                          }
                        >
                          <option value={CASAR_AUTOMATICO}>Casar pelo nome</option>
                          <option value={CASAR_NOVA}>Criar disciplina nova</option>
                          {catalogo.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className={`${botaoSecundario} hover:text-bad`}
                        onClick={() =>
                          editarDisciplinas((lista) => lista.filter((_, i) => i !== indice))
                        }
                      >
                        Remover disciplina
                      </button>
                    </div>

                    <ArvoreEditavel
                      nos={disciplina.topicos}
                      previa={previa?.topicos}
                      onChange={(topicos) =>
                        editarDisciplinas((lista) =>
                          lista.map((item, i) => (i === indice ? { ...item, topicos } : item)),
                        )
                      }
                    />
                    <button
                      type="button"
                      className={`w-fit text-sm ${linkAcao}`}
                      onClick={() =>
                        editarDisciplinas((lista) =>
                          lista.map((item, i) =>
                            i === indice
                              ? { ...item, topicos: [...item.topicos, { nome: "", filhos: [] }] }
                              : item,
                          ),
                        )
                      }
                    >
                      <NavIcon name="plus" className="h-3.5 w-3.5" />
                      Adicionar tópico
                    </button>
                  </div>
                </details>
              );
            })}
          </section>
        </>
      ) : null}

      {erro ? (
        <p role="alert" className={`sticky bottom-20 ${alertaErro}`}>
          {erro}
        </p>
      ) : null}

      {editavel ? (
        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 border-t border-line bg-paper/95 px-1 py-3 backdrop-blur">
          <button
            type="button"
            className={botaoPrimario}
            disabled={ocupado !== null}
            onClick={() => void publicar()}
          >
            {ocupado === "publicar" ? "Publicando…" : "Publicar este cargo"}
          </button>
          <button
            type="button"
            className={botaoSecundario}
            disabled={ocupado !== null || !pendente}
            onClick={() => void salvar()}
          >
            {ocupado === "salvar" ? "Salvando…" : pendente ? "Salvar e conferir" : "Salvo"}
          </button>
          <span className="flex-1" />
          <button
            type="button"
            className={`text-sm font-medium text-bad hover:underline ${focusRing}`}
            disabled={ocupado !== null}
            onClick={() => void descartar()}
          >
            Descartar importação
          </button>
        </div>
      ) : null}
    </PageContainer>
  );
}

function Conferencia({
  conferencia,
  pendente,
}: {
  conferencia?: ImportacaoDetalhe["cargos"][number];
  pendente: boolean;
}) {
  if (pendente || !conferencia) {
    return (
      <p className="text-[13px] text-muted">
        Há alterações não salvas. Salve para conferir de novo com o catálogo.
      </p>
    );
  }
  const { resumo } = conferencia;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel px-4 py-3">
      <p className="text-sm text-ink">
        {resumo.disciplinas} {resumo.disciplinas === 1 ? "disciplina" : "disciplinas"} ·{" "}
        {resumo.topicos} {resumo.topicos === 1 ? "tópico" : "tópicos"}
        <span className="text-muted">
          {" "}
          ({resumo.reaproveitados} já no catálogo, {resumo.novos} novos)
        </span>
        {resumo.cobertura !== null ? (
          <span className="text-muted">
            {" "}
            · cobertura de {Math.round(resumo.cobertura * 100)}% dos itens numerados
          </span>
        ) : null}
      </p>
      {resumo.avisos.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-[13px] text-warn">
          {resumo.avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      ) : null}
      <p className="flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok" />
          já existe no catálogo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full border border-accent" />
          tópico novo
        </span>
      </p>
    </div>
  );
}
