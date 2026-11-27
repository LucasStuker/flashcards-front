"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArvoreTopicos } from "@/components/ArvoreTopicos";
import { NavIcon } from "@/components/NavIcon";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { BotaoInscricao } from "@/components/editais/BotaoInscricao";
import { alertaErro, focusRing, linkAcao } from "@/components/ui";
import { EditalOficial, Topico, getEditalOficial } from "@/lib/api";

function contarTopicos(topicos: Topico[]): number {
  return topicos.reduce((total, topico) => total + 1 + contarTopicos(topico.filhos), 0);
}

export default function EditalOficialPage() {
  const params = useParams<{ id: string }>();
  const [edital, setEdital] = useState<EditalOficial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      setEdital(null);
      setError("Edital não encontrado");
      return;
    }

    let active = true;
    void getEditalOficial(id)
      .then((data) => {
        if (!active) return;
        setEdital(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setEdital(null);
        setError(err instanceof Error ? err.message : "Falha ao carregar edital");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <PageContainer>
      <Link href="/editais" className={`w-fit text-sm ${linkAcao}`}>
        ← Editais
      </Link>

      {error ? (
        <p role="alert" className={alertaErro}>
          {error}
        </p>
      ) : null}

      {!edital && !error ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {edital ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {edital.cargo}
              </h1>
              {edital.area ? <p className="text-sm font-medium text-ink/80">{edital.area}</p> : null}
              <p className="text-sm text-muted">
                {edital.orgao} · {edital.banca} · {edital.ano}
              </p>
            </div>
            <BotaoInscricao
              editalId={edital.id}
              cargo={edital.cargo}
              inscrito={edital.inscrito}
              onChange={(inscrito) => setEdital({ ...edital, inscrito })}
            />
          </div>

          <Bloco
            id="disciplinas-edital-heading"
            titulo="Conteúdo programático"
            acao={
              <span className="text-[13px] text-muted">
                {edital.disciplinas.length}{" "}
                {edital.disciplinas.length === 1 ? "disciplina" : "disciplinas"}
              </span>
            }
          >
            {edital.disciplinas.length === 0 ? (
              <EstadoVazio
                icone="folder"
                titulo="Ainda não há disciplina"
                texto="O conteúdo deste edital aparece aqui assim que for cadastrado."
              />
            ) : (
              <ul>
                {edital.disciplinas.map((disciplina) => {
                  const total = contarTopicos(disciplina.topicos);
                  return (
                    <li key={disciplina.id} className="border-b border-line last:border-0">
                      <details className="group">
                        <summary
                          className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-paper ${focusRing}`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            <NavIcon
                              name="chevron-right"
                              className="h-4 w-4 text-muted transition-transform group-open:rotate-90"
                            />
                            {disciplina.nome}
                          </span>
                          <span className="text-[13px] text-muted">
                            {total} {total === 1 ? "tópico" : "tópicos"}
                          </span>
                        </summary>
                        <div className="border-t border-line bg-paper/40">
                          <ArvoreTopicos topicos={disciplina.topicos} />
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </Bloco>
        </>
      ) : null}
    </PageContainer>
  );
}
