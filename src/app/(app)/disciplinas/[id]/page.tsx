"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { alertaErro, linkAcao } from "@/components/ui";
import { Disciplina, Topico, getDisciplina } from "@/lib/api";

export default function DisciplinaPage() {
  const params = useParams<{ id: string }>();
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      setDisciplina(null);
      setError("Disciplina não encontrada");
      return;
    }

    let active = true;
    void getDisciplina(id)
      .then((data) => {
        if (!active) return;
        setDisciplina(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setDisciplina(null);
        setError(err instanceof Error ? err.message : "Falha ao carregar disciplina");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <PageContainer>
      <Link href="/disciplinas" className={`w-fit text-sm ${linkAcao}`}>
        ← Disciplinas
      </Link>

      {error ? (
        <p role="alert" className={alertaErro}>
          {error}
        </p>
      ) : null}

      {!disciplina && !error ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {disciplina ? (
        <>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {disciplina.nome}
          </h1>
          <Bloco id="topicos-heading" titulo="Tópicos">
            {disciplina.topicos.length === 0 ? (
              <EstadoVazio
                icone="folder"
                titulo="Ainda não há tópico"
                texto="Os tópicos desta disciplina aparecem aqui assim que forem cadastrados."
              />
            ) : (
              <ArvoreTopicos topicos={disciplina.topicos} nivel={0} />
            )}
          </Bloco>
        </>
      ) : null}
    </PageContainer>
  );
}

function ArvoreTopicos({ topicos, nivel }: { topicos: Topico[]; nivel: number }) {
  return (
    <ul className={nivel === 0 ? "text-sm" : "border-l border-line pl-3"}>
      {topicos.map((topico) => (
        <li
          key={topico.id}
          className={nivel === 0 ? "border-b border-line px-4 py-2.5 last:border-0" : "pt-1.5"}
        >
          <span className={nivel === 0 ? "font-medium text-ink" : "text-ink/80"}>{topico.nome}</span>
          {topico.filhos.length > 0 ? (
            <div className="mt-1.5">
              <ArvoreTopicos topicos={topico.filhos} nivel={nivel + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
